import crypto from 'crypto';
import { GroqProvider } from '../providers/GroqProvider.js';
import { StateManager } from '../state/StateManager.js';
import { watchdog } from '../state/WorkflowWatchdog.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { RepairEngine } from '../repair/RepairEngine.js';
import { PromptBuilder } from '../prompts/PromptBuilder.js';
import RedisManager, { DURATIONS } from '../state/RedisManager.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
import { ToolRegistry, VALID_TOOLS, getFunctionDeclarations } from '../security/ToolRegistry.js';
import { EXECUTION_STATUS, CONFIRMATION_STATUS } from '../../../constants/aiConstants.js';
import { AIProviderError, ValidationError, OCCConflictError } from '../../../utils/errors.js';
import workflowService from '../../workflowService.js';
import intentFallbackService from '../../intentFallbackService.js';

function validateObjectDepth(obj, maxDepth = 5, currentDepth = 0, visited = new WeakSet()) {
    if (currentDepth > maxDepth) throw new ValidationError(`Max tool argument depth exceeded (${maxDepth})`);
    if (obj !== null && typeof obj === 'object') {
        if (visited.has(obj)) return;
        visited.add(obj);

        if (Array.isArray(obj) && obj.length > 100) {
            throw new ValidationError(`Max array cardinality exceeded (100). Array size: ${obj.length}`);
        }

        const keys = Object.keys(obj);
        if (keys.length > 100) {
            throw new ValidationError(`Max object keys exceeded (100). Key count: ${keys.length}`);
        }

        for (const key of keys) {
            validateObjectDepth(obj[key], maxDepth, currentDepth + 1, visited);
        }
    }
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export class AiOrchestrator {
    constructor() {
        this.provider = new GroqProvider();
        if (process.env.WORKFLOW_WATCHDOG_ENABLED === 'true') {
            watchdog.start(); // Start the lease-protected, OCC-guarded watchdog
        } else {
            console.log('[Orchestrator] Watchdog disabled on this instance.');
        }
    }

    isConfirmation(text) { return /^(yes|confirm|proceed|okay|sure|submit)$/i.test(text.toLowerCase().trim()); }
    isCancellation(text) { return /^(cancel|stop|edit|wait|no|abort)$/i.test(text.toLowerCase().trim()); }

    async processInput(text, user, frontendHistory = [], conversationId = null) {
        if (!conversationId) conversationId = crypto.randomUUID();
        
        // Strict Client-Supplied ID Validation
        if (conversationId.length > 100 || !UUID_REGEX.test(conversationId)) {
            return { version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE", message: "Invalid session identifier.", timestamp: Date.now(), traceId: "UNKNOWN" };
        }
        
        const newTraceId = `AI-${new Date().getFullYear()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        const traceContext = { id: newTraceId }; // Immutable trace context object
        const startTime = Date.now();

        try {
            // 1. Zero-Trust Server-Side History Integration
            let history = await RedisManager.getHistory(conversationId);
            if (history.length === 0 && frontendHistory.length > 0) {
                // Fallback bridge for MVP frontend transition
                history = MemoryManager.sanitizeFrontendHistory(frontendHistory);
            }

            // 2. Pending Action Routing (Redis Authoritative)
            const pending = await RedisManager.getPendingAction(conversationId);
            if (pending) {
                traceContext.id = pending.traceId;
                
                const userIdStr = user && user._id ? user._id.toString() : 'guest';
                if (pending.ownerId !== userIdStr) throw new Error("Cross-role attack or session mismatch detected.");

                if (this.isCancellation(text)) {
                    const execId = crypto.randomUUID();
                    try {
                        await StateManager.transition(pending.traceId, EXECUTION_STATUS.PENDING_CONFIRMATION, EXECUTION_STATUS.CANCELLED, execId, {
                            confirmationStatus: CONFIRMATION_STATUS.REJECTED
                        });
                        await RedisManager.deletePendingAction(conversationId); // Authoritative DB first, volatile Redis second
                    } catch (err) { console.error("Failed to log cancellation:", err); }
                    
                    return { version: "v1", success: true, type: "INFO", action: "AI_RESPONSE", message: "Operation cancelled successfully.", timestamp: Date.now(), traceId: pending.traceId };
                }

                if (this.isConfirmation(text)) {
                    const lockToken = await RedisManager.acquireLock(conversationId);
                    if (!lockToken) {
                        return { version: "v1", success: false, type: "WARNING", action: "AI_RESPONSE", message: "Action is currently executing in another process. Please wait.", timestamp: Date.now(), traceId: pending.traceId };
                    }

                    const execId = crypto.randomUUID();

                    try {
                        await StateManager.transition(pending.traceId, EXECUTION_STATUS.PENDING_CONFIRMATION, EXECUTION_STATUS.EXECUTING, execId);
                    } catch (e) {
                        await RedisManager.releaseLock(conversationId, lockToken);
                        if (e instanceof OCCConflictError) {
                            return { version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE", message: "Action is currently executing or has already been completed.", timestamp: Date.now(), traceId: pending.traceId };
                        }
                        return { version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE", message: "Failed to lock execution state. Please try again.", timestamp: Date.now(), traceId: pending.traceId };
                    }

                    let active = true;
                    const controller = new AbortController();
                    const startedAt = Date.now();

                    // Jittered Heartbeat Loop with Failure Escalation
                    const heartbeatPromise = (async () => {
                        while (active) {
                            await sleep(4500 + Math.random() * 1000);
                            if (!active) break;
                            
                            if (Date.now() - startedAt > DURATIONS.WORKFLOW_TIMEOUT_MS) {
                                console.warn(`[Orchestrator] Execution timeout ceiling reached for ${execId}`);
                                controller.abort(new Error("EXECUTION_TIMEOUT"));
                                break;
                            }

                            const renewed = await RedisManager.extendLock(conversationId, lockToken);
                            if (!renewed && active) {
                                console.error(`[Orchestrator] Heartbeat lock renewal failed for ${execId}. Escalating to cooperative abort.`);
                                controller.abort(new Error("HEARTBEAT_RENEWAL_FAILED"));
                                break;
                            }
                        }
                    })();

                    try {
                        const metadata = { llmLatency: Date.now() - startTime, modelName: 'llama-3.3-70b-versatile', promptVersion: 'v1.0' };
                        
                        // Pass signal to workflowService for cooperative cancellation
                        const workflowPromise = workflowService.executeWorkflow(pending.tool, pending.args, user, conversationId, pending.traceId, metadata, { signal: controller.signal, execId });
                        
                        // Strict 30s timeout safety net just in case heartbeat loop fails to abort
                        const hardTimeout = sleep(DURATIONS.WORKFLOW_TIMEOUT_MS).then(() => {
                            controller.abort(new Error("EXECUTION_TIMEOUT"));
                            throw new Error("EXECUTION_TIMEOUT");
                        });

                        const result = await Promise.race([workflowPromise, hardTimeout]);
                        
                        await RedisManager.deletePendingAction(conversationId); 
                        try { await StateManager.transition(pending.traceId, EXECUTION_STATUS.EXECUTING, EXECUTION_STATUS.COMPLETED, execId); } catch(err) { console.error("Failed to log completion state:", err); }
                        
                        return { ...result, version: "v1", timestamp: Date.now(), traceId: pending.traceId };
                    } catch (workflowErr) {
                        const isTimeout = workflowErr.message === "EXECUTION_TIMEOUT" || workflowErr.name === "AbortError";
                        const finalStatus = isTimeout ? EXECUTION_STATUS.EXECUTION_TIMEOUT : EXECUTION_STATUS.FAILED;
                        
                        try { 
                            await StateManager.transition(pending.traceId, EXECUTION_STATUS.EXECUTING, finalStatus, execId, {
                                rootCause: workflowErr.message,
                                timeoutOrigin: controller.signal.reason?.message || "workflow"
                            }); 
                        } catch(err) { console.error("Failed to log workflow failure:", err); }

                        return {
                            version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE",
                            message: isTimeout ? "The action timed out while executing. Please try again." : "The action failed to execute.",
                            timestamp: Date.now(), traceId: pending.traceId
                        };
                    } finally {
                        active = false;
                        await RedisManager.releaseLock(conversationId, lockToken); // Guaranteed release
                        await heartbeatPromise; // Ensure heartbeat resolves cleanly without dangling promises
                    }
                }
                
                return {
                    version: "v1", success: false, type: "WARNING", action: "AI_RESPONSE",
                    message: `You have a pending action (${pending.tool}) waiting for confirmation. Please reply with 'yes' to proceed, or 'cancel' to discard it.`,
                    timestamp: Date.now(), traceId: pending.traceId
                };
            }

            // 3. Provider Call & Orchestration
            const messages = [
                { role: "system", content: PromptBuilder.getSystemInstruction(user) },
                ...history,
                { role: "user", content: text }
            ];

            const providerResponse = await this.provider.generateResponse(messages, getFunctionDeclarations());
            let finalToolCalls = providerResponse.toolCalls;

            if (!providerResponse.content && finalToolCalls.length === 0) {
                return {
                    version: "v1", success: false, type: "WARNING", action: "AI_RESPONSE",
                    message: "The AI service is currently degraded and returned an empty response. Please try again.",
                    timestamp: Date.now(), traceId: newTraceId
                };
            }

            // 4. Pure Repair Engine Loop
            const MAX_REPAIR_ATTEMPTS = 1;
            const validatedTools = [];

            // Sequential Tool Policy with Halt-on-Failure semantics
            for (const toolCall of finalToolCalls) {
                const toolName = toolCall.name;
                let parsedArgs;
                let currentAttempt = 0;

                if (!VALID_TOOLS.includes(toolName)) {
                    return { version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE", message: "I attempted to execute an invalid action. Please try again.", timestamp: Date.now(), traceId: newTraceId };
                }

                // --- EARLY SECURITY LAYER ---
                const roleRules = {
                    'trigger_sos': ['student', 'teacher', 'hod', 'warden', 'principal', 'guest'],
                    'draft_complaint': ['student', 'teacher', 'hod', 'warden', 'principal'],
                    'submit_leave': ['student', 'teacher'],
                    'create_assignment': ['teacher', 'hod'],
                    'submit_assignment': ['student'],
                    'get_my_content': ['student', 'teacher']
                };
                const userRole = user ? user.role : 'guest';
                if (roleRules[toolName] && !roleRules[toolName].includes(userRole)) {
                    console.warn(`[Security] Blocked unauthorized tool call: ${toolName} for role ${userRole}`);
                    const roleNames = { 'student': 'Student', 'teacher': 'Faculty', 'hod': 'HOD', 'warden': 'Warden', 'principal': 'Principal' };
                    return { 
                        version: "v1", success: false, type: "WARNING", action: "AI_RESPONSE", 
                        message: `You are logged in as a ${roleNames[userRole] || userRole}. This action is restricted to authorized personnel only.`, 
                        timestamp: Date.now(), traceId: newTraceId 
                    };
                }
                // ----------------------------

                const schema = ToolRegistry[toolName]?.schema;
                let payloadRaw = toolCall.arguments;
                let isValid = false;

                while (currentAttempt <= MAX_REPAIR_ATTEMPTS && !isValid) {
                    try {
                        if (typeof payloadRaw === 'string') {
                            if (Buffer.byteLength(payloadRaw, 'utf8') > 10000) {
                                throw new ValidationError("Initial payload exceeds safe parse budget (10KB)", payloadRaw);
                            }
                            // Anti-Recursion Parsing Bomb Heuristic
                            const structuralTokens = payloadRaw.match(/[\[\{]/g)?.length || 0;
                            if (structuralTokens > 200) {
                                throw new ValidationError("Payload structure triggers recursion depth limits. Halting.", payloadRaw);
                            }
                        }
                        const parsed = typeof payloadRaw === 'string' ? JSON.parse(payloadRaw) : payloadRaw;
                        validateObjectDepth(parsed); // Guard against nesting bombs

                        if (schema) {
                            const validation = schema.safeParse(parsed);
                            if (!validation.success) {
                                throw new ValidationError(validation.error.message, payloadRaw, true);
                            }
                            parsedArgs = validation.data;
                        } else {
                            parsedArgs = parsed;
                        }
                        isValid = true;
                    } catch (err) {
                        currentAttempt++;
                        if (currentAttempt > MAX_REPAIR_ATTEMPTS) {
                            console.error(`[Orchestrator] Repair failed completely for ${toolName}. Halting execution chain.`);
                            return { version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE", message: "Failed to validate action arguments. Halting.", timestamp: Date.now(), traceId: newTraceId };
                        }
                        
                        // Prevent amplification attacks by blocking massive payloads from repair engine
                        const payloadString = typeof payloadRaw === 'string' ? payloadRaw : JSON.stringify(payloadRaw);
                        if (Buffer.byteLength(payloadString, 'utf8') > 2048) {
                            console.error(`[Orchestrator] Halting repair. Malformed payload exceeds 2KB budget.`);
                            return { version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE", message: "AI response exceeded safe boundaries. Halting.", timestamp: Date.now(), traceId: newTraceId };
                        }

                        console.warn(`[Orchestrator] Triggering pure repair engine for ${toolName}.`);
                        // Trust No Repair: we get the raw repair back, and let the while loop parse it again
                        const repairedObj = await RepairEngine.attemptRepair(this.provider, toolName, schema, payloadRaw, err);
                        payloadRaw = typeof repairedObj === 'object' ? JSON.stringify(repairedObj) : repairedObj;
                    }
                }

                validatedTools.push({ name: toolName, args: parsedArgs });
            }

            // 5. Execution Router
            if (validatedTools.length > 0) {
                for (let i = 0; i < validatedTools.length; i++) {
                    const vt = validatedTools[i];
                    
                    if (ToolRegistry[vt.name].critical) {
                        const metadata = { llmLatency: providerResponse.latency, modelName: providerResponse.provider, promptVersion: 'v1.0' };
                        const workflowResult = await workflowService.executeWorkflow(vt.name, vt.args, user, conversationId, newTraceId, metadata);
                        if (i === validatedTools.length - 1) {
                            // If the result is a REDIRECT, return immediately to handle UI transition
                            if (workflowResult.type === 'REDIRECT' || workflowResult.type === 'CONFIRMATION') {
                                return { ...workflowResult, version: "v1", timestamp: Date.now(), traceId: newTraceId };
                            }

                            // Otherwise, feed the result back to the AI for a conversational summary
                            const toolResult = typeof workflowResult.payload === 'object' ? JSON.stringify(workflowResult.payload) : workflowResult.message;
                            
                            const secondTurnMessages = [
                                { role: "system", content: PromptBuilder.getSystemInstruction(user) },
                                ...history,
                                { role: "user", content: text },
                                { 
                                    role: "assistant", 
                                    content: providerResponse.content || "", 
                                    tool_calls: providerResponse.toolCalls.map(tc => ({
                                        id: tc.id,
                                        type: 'function',
                                        function: { name: tc.name, arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(vt.args) }
                                    }))
                                },
                                { 
                                    role: "tool", 
                                    tool_call_id: providerResponse.toolCalls[i].id, 
                                    name: vt.name, 
                                    content: toolResult 
                                }
                            ];

                            const finalResponse = await this.provider.generateResponse(secondTurnMessages, null);
                            
                            // Save complete history including tool turn
                            history.push({ role: "user", content: text });
                            history.push({ 
                                role: "assistant", 
                                content: providerResponse.content || "", 
                                tool_calls: secondTurnMessages[secondTurnMessages.length - 2].tool_calls 
                            });
                            history.push({ 
                                role: "tool", 
                                tool_call_id: providerResponse.toolCalls[i].id, 
                                name: vt.name, 
                                content: toolResult 
                            });
                            history.push({ role: "assistant", content: finalResponse.content });

                            const sanitizedForSave = MemoryManager.sanitizeRedisHistory(history);
                            await RedisManager.saveHistory(conversationId, sanitizedForSave);

                            return { 
                                version: "v1", success: true, type: "SUCCESS", action: "AI_RESPONSE",
                                message: finalResponse.content,
                                payload: workflowResult.payload,
                                timestamp: Date.now(), traceId: newTraceId 
                            };
                        }
                    } else {
                        // MUST AWAIT TRACE CREATION FIRST (Authoritative State)
                        try {
                            await StateManager.createTrace(conversationId, {
                                traceId: newTraceId,
                                conversationId,
                                userId: user && user._id ? user._id : null,
                                role: user && user.role ? user.role : 'guest',
                                intent: vt.name.toUpperCase(),
                                tool: vt.name,
                                generatedArgs: vt.args,
                                executionStatus: EXECUTION_STATUS.PENDING_CONFIRMATION,
                                confirmationStatus: CONFIRMATION_STATUS.PENDING,
                                metrics: { modelLatency: providerResponse.latency, modelName: providerResponse.provider, promptVersion: 'v1.0' }
                            });
                            
                            // State exists, NOW update Redis memory
                            try {
                                await RedisManager.setPendingAction(conversationId, {
                                    traceId: newTraceId,
                                    tool: vt.name,
                                    args: vt.args,
                                    ownerId: user && user._id ? user._id.toString() : 'guest',
                                    createdAt: Date.now()
                                });
                            } catch (redisErr) {
                                console.error("[CRITICAL] Redis setPendingAction failed or flooded.", redisErr);
                                return { version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE", message: "System is currently under heavy load. Please try again later.", timestamp: Date.now(), traceId: newTraceId };
                            }
                        } catch (err) {
                            console.error("[CRITICAL] Failed to initialize FSM workflow trace in Mongo.", err);
                            return { version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE", message: "Unable to initialize workflow trace.", timestamp: Date.now(), traceId: newTraceId };
                        }

                        return {
                            version: "v1", success: true, type: "CONFIRMATION", action: "AI_RESPONSE",
                            message: `I have prepared the action (${vt.name}). Would you like me to proceed?`,
                            requiresConfirmation: true, payload: vt.args, timestamp: Date.now(), traceId: newTraceId
                        };
                    }
                }
            }

            // 6. Zero-Trust History Append
            history.push({ role: "user", content: text });
            history.push({ role: "assistant", content: providerResponse.content || "" });
            const sanitizedForSave = MemoryManager.sanitizeRedisHistory(history);
            await RedisManager.saveHistory(conversationId, sanitizedForSave);

            return {
                version: "v1", success: true, type: "QUESTION", action: "AI_RESPONSE",
                message: providerResponse.content || "I am processing your request.",
                timestamp: Date.now(), traceId: newTraceId
            };

        } catch (error) {
            console.error("AI Orchestrator Error:", error);
            
            if (error instanceof AIProviderError) {
                return intentFallbackService.process(text, user, traceContext.id, error);
            }
            
            if (error instanceof ValidationError) {
                return {
                    version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE",
                    message: `I encountered a problem with the action details: ${error.message}`,
                    timestamp: Date.now(), traceId: traceContext.id
                };
            }

            return {
                version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE",
                message: "An internal orchestration error occurred while processing your request.",
                timestamp: Date.now(), traceId: traceContext.id
            };
        }
    }
}

export default new AiOrchestrator();
