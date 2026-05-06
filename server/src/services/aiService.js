import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from 'crypto';
import workflowService from './workflowService.js';
import intentFallbackService from './intentFallbackService.js';
import AIActionLog from '../models/AIActionLog.js';
import { EXECUTION_STATUS, CONFIRMATION_STATUS } from '../constants/aiConstants.js';

export class AiService {
    constructor() {
        this.genAI = null;
        
        // Advanced State Management for Multi-turn Confirmations
        // Keyed by conversationId to be multi-tab safe
        this.pendingActions = new Map();
        
        // Cache static prompt rules
        this.basePrompt = `You are the CampusCare AI, a role-aware intelligent campus assistant integrated into a Smart Campus Management System.

CORE PRINCIPLES:
1. ROLE-AWARE EXECUTION: Only allow actions permitted for the user's role. Refuse unauthorized operations politely.
2. CONVERSATIONAL WORKFLOW: NEVER assume missing information. If required info is missing, ask follow-up questions ONE-BY-ONE naturally.
3. HUMAN-IN-THE-LOOP SAFETY: NEVER perform sensitive actions directly. Show a preview before final submission.`;

        this.toolRules = `
TOOL USAGE RULES:
- If the user provides incomplete info, reply with text asking for the missing info.
- Once you have gathered all required info, IMMEDIATELY call the appropriate tool. DO NOT ask the user for confirmation yourself. The system backend will handle the confirmation UI automatically.
- ONLY exception: For SOS or Emergency, IMMEDIATELY call the trigger_sos tool.`;

        this.boundaries = `
BOUNDARIES:
AI CANNOT modify marks, change passwords, approve leaves automatically, bypass HOD approval, or reveal private records.`;
    }

    init() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY is not set in .env. Agentic features are disabled.");
            return false;
        }
        if (!this.genAI) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }
        // Start cleanup interval for expired actions
        if (!this.cleanupInterval) {
            this.cleanupInterval = setInterval(() => this.cleanExpiredActions(), 60000);
        }
        
        return true;
    }

    async cleanExpiredActions() {
        const now = Date.now();
        for (const [convId, action] of this.pendingActions.entries()) {
            if (now > action.expiresAt) {
                this.pendingActions.delete(convId);
                try {
                    await AIActionLog.findOneAndUpdate(
                        { traceId: action.traceId },
                        {
                            executionStatus: EXECUTION_STATUS.EXPIRED,
                            confirmationStatus: CONFIRMATION_STATUS.PENDING
                        },
                        { upsert: false }
                    );
                } catch (err) {
                    console.error("Failed to log expired action:", err);
                }
            }
        }
    }

    getRolePrompt(user) {
        const role = user ? user.role : 'guest';
        const name = user ? user.name : 'User';
        
        let roleCapabilities = "";
        if (role === 'student') {
            roleCapabilities = `As a Student, you can: Complaint Management, Assignment Submission, Leave Application, trigger SOS.`;
        } else if (role === 'teacher') {
            roleCapabilities = `As a Teacher, you can: Create assignments, Upload notes, Monitor students, Send automated messages.`;
        } else if (role === 'hod') {
            roleCapabilities = `As HOD, you can: Allocate subjects, Generate routines, Assign mentors, Review leaves.`;
        } else if (role === 'warden') {
            roleCapabilities = `As Warden, you can: Handle hostel complaints, Manage mess menu, Manage hostel students.`;
        } else if (role === 'principal') {
            roleCapabilities = `As Principal, you can: Institutional Oversight, Broadcast notices.`;
        }

        return `Your current user is ${name}, logged in as a ${role}.\nROLE CAPABILITIES:\n${roleCapabilities}`;
    }

    getSystemInstruction(user) {
        return `${this.basePrompt}\n\n${this.getRolePrompt(user)}\n\n${this.boundaries}\n\n${this.toolRules}`;
    }

    getFunctionDeclarations() {
        return [
            {
                name: "trigger_sos",
                description: "Immediately trigger an SOS emergency workflow. Bypasses confirmation.",
                parameters: {
                    type: "OBJECT",
                    properties: { emergencyType: { type: "STRING" }, location: { type: "STRING" }, details: { type: "STRING" } },
                    required: ["emergencyType"]
                }
            },
            {
                name: "draft_complaint",
                description: "Submit a complaint draft after getting user confirmation.",
                parameters: {
                    type: "OBJECT",
                    properties: { title: { type: "STRING" }, description: { type: "STRING" }, category: { type: "STRING" }, priority: { type: "STRING" }, department: { type: "STRING" } },
                    required: ["title", "description", "category", "priority"]
                }
            },
            {
                name: "submit_leave",
                description: "Submit a leave application after getting user confirmation.",
                parameters: {
                    type: "OBJECT",
                    properties: { reason: { type: "STRING" }, startDate: { type: "STRING" }, endDate: { type: "STRING" }, leaveType: { type: "STRING" } },
                    required: ["reason", "startDate", "endDate", "leaveType"]
                }
            },
            {
                name: "create_assignment",
                description: "Create an assignment after getting user confirmation. (Teacher role)",
                parameters: {
                    type: "OBJECT",
                    properties: { subject: { type: "STRING" }, batch: { type: "STRING" }, deadline: { type: "STRING" }, marks: { type: "STRING" }, instructions: { type: "STRING" } },
                    required: ["subject", "batch", "deadline"]
                }
            }
        ];
    }

    sanitizeHistory(history) {
        if (!Array.isArray(history)) return [];
        const safeHistory = history.filter(h => 
            ["user", "model"].includes(h.role) && 
            Array.isArray(h.parts) && 
            h.parts.length > 0 &&
            typeof h.parts[0]?.text === 'string'
        );
        return safeHistory.slice(-20); // Prevent memory/token explosion
    }

    // Confirmation NLP
    isConfirmation(text) {
        const normalized = text.toLowerCase().trim();
        const positives = ["yes", "proceed", "confirm", "continue", "do it", "submit", "okay", "sure"];
        return positives.some(p => normalized === p || normalized.startsWith(p));
    }

    isCancellation(text) {
        const normalized = text.toLowerCase().trim();
        const negatives = ["cancel", "stop", "edit", "wait", "no", "abort"];
        return negatives.some(n => normalized === n || normalized.startsWith(n));
    }

    async processInput(text, user, history = [], conversationId = null) {
        const newTraceId = `AI-${new Date().getFullYear()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        
        if (!this.init()) {
            return intentFallbackService.process(text, user, newTraceId);
        }

        if (!conversationId) conversationId = crypto.randomUUID(); // Fallback if frontend missed it

        const startTime = Date.now();
        let currentTraceId = newTraceId;

        try {
            // 1. Check for Pending Action Execution
            if (this.pendingActions.has(conversationId)) {
                const pending = this.pendingActions.get(conversationId);
                currentTraceId = pending.traceId;
                
                // Security: Owner validation
                const userIdStr = user && user._id ? user._id.toString() : 'guest';
                if (pending.ownerId !== userIdStr) {
                    throw new Error("Cross-role attack or session mismatch detected.");
                }

                if (this.isCancellation(text)) {
                    this.pendingActions.delete(conversationId);
                    
                    try {
                        await AIActionLog.findOneAndUpdate(
                            { traceId: pending.traceId },
                            {
                                executionStatus: EXECUTION_STATUS.CANCELLED,
                                confirmationStatus: CONFIRMATION_STATUS.REJECTED
                            },
                            { upsert: false }
                        );
                    } catch (err) {
                        console.error("Failed to log cancellation:", err);
                    }
                    
                    return {
                        version: "v1", success: true, type: "INFO", action: "AI_RESPONSE",
                        message: "Operation cancelled successfully.",
                        timestamp: Date.now(), traceId: pending.traceId
                    };
                }

                if (this.isConfirmation(text)) {
                    // Idempotency execution lock
                    if (pending.executing) {
                        return { version: "v1", success: false, type: "WARNING", action: "AI_RESPONSE", message: "Action is currently executing. Please wait.", timestamp: Date.now(), traceId: pending.traceId };
                    }
                    
                    pending.executing = true;
                    this.pendingActions.set(conversationId, pending);

                    // Log EXECUTING
                    try {
                        await AIActionLog.findOneAndUpdate(
                            { traceId: pending.traceId },
                            { executionStatus: EXECUTION_STATUS.EXECUTING },
                            { upsert: false }
                        );
                    } catch (e) {
                        console.error("Failed to log EXECUTING:", e);
                    }

                    // Execute Workflow
                    try {
                        const metadata = { llmLatency: Date.now() - startTime, modelName: 'gemini-flash-latest', promptVersion: 'v1.0' };
                        const result = await workflowService.executeWorkflow(pending.tool, pending.args, user, conversationId, pending.traceId, metadata);
                        this.pendingActions.delete(conversationId);
                        return { ...result, version: "v1", timestamp: Date.now(), traceId: pending.traceId };
                    } finally {
                        if (this.pendingActions.has(conversationId)) {
                            pending.executing = false;
                            this.pendingActions.set(conversationId, pending);
                        }
                    }
                }
                
                // If input is neither confirmation nor cancellation, enforce explicit choice
                return {
                    version: "v1", success: false, type: "WARNING", action: "AI_RESPONSE",
                    message: `You have a pending action (${pending.tool}) waiting for confirmation. Please reply with 'yes' to proceed, or 'cancel' to discard it.`,
                    timestamp: Date.now(), traceId: pending.traceId
                };
            }

            // 2. Pass to AI for Intent & Conversation
            const model = this.genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                systemInstruction: this.getSystemInstruction(user),
                tools: [{ functionDeclarations: this.getFunctionDeclarations() }],
                toolConfig: { functionCallingConfig: { mode: "AUTO" } }
            });

            const chat = model.startChat({ history: this.sanitizeHistory(history) });
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error("AI_TIMEOUT")), 30000); // Increased to 30s to prevent premature LLM aborts
            });
            
            let result;
            try {
                result = await Promise.race([
                    chat.sendMessage(text),
                    timeoutPromise
                ]);
            } finally {
                clearTimeout(timeoutId);
            }
            
            let response = result.response;
            const functionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls;
            
            // 3. Handle Tool Calls
            if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];
                
                // DEFENSIVE CONTRACT: Never trust LLM tool names natively
                const validTools = ['trigger_sos', 'draft_complaint', 'submit_leave', 'create_assignment'];
                if (!call || !validTools.includes(call.name)) {
                    return {
                        version: "v1", success: false, type: "ERROR", action: "AI_RESPONSE",
                        message: "I attempted to execute an invalid action. Please try again.",
                        timestamp: Date.now(), traceId: newTraceId
                    };
                }
                
                const args = call.args;

                // Immediate execution for SOS
                if (call.name === 'trigger_sos') {
                    const metadata = { llmLatency: Date.now() - startTime, modelName: 'gemini-flash-latest', promptVersion: 'v1.0' };
                    const workflowResult = await workflowService.executeWorkflow(call.name, args, user, conversationId, newTraceId, metadata);
                    return { ...workflowResult, version: "v1", timestamp: Date.now(), traceId: newTraceId };
                }

                // Halt and Store Pending Confirmation for other actions
                this.pendingActions.set(conversationId, {
                    traceId: newTraceId,
                    tool: call.name,
                    args: args,
                    ownerId: user && user._id ? user._id.toString() : 'guest',
                    createdAt: Date.now(),
                    expiresAt: Date.now() + (5 * 60 * 1000), // 5 min TTL
                    executing: false
                });
                
                // Log PENDING_CONFIRMATION
                try {
                    await AIActionLog.create({
                        traceId: newTraceId,
                        conversationId,
                        userId: user && user._id ? user._id : null,
                        role: user && user.role ? user.role : 'guest',
                        intent: call.name.toUpperCase(),
                        tool: call.name,
                        generatedArgs: args,
                        executionStatus: EXECUTION_STATUS.PENDING_CONFIRMATION,
                        confirmationStatus: CONFIRMATION_STATUS.PENDING,
                        metrics: {
                            modelLatency: Date.now() - startTime,
                            modelName: 'gemini-flash-latest',
                            promptVersion: 'v1.0'
                        }
                    });
                } catch (err) {
                    console.error("Failed to log PENDING_CONFIRMATION:", err);
                }

                return {
                    version: "v1",
                    success: true,
                    type: "CONFIRMATION",
                    action: "AI_RESPONSE",
                    message: `I have prepared the action (${call.name}). Would you like me to proceed?`,
                    requiresConfirmation: true,
                    payload: args,
                    timestamp: Date.now(),
                    traceId: newTraceId
                };
            }

            // 4. Handle Standard Text Response
            const llmLatency = Date.now() - startTime;
            return {
                version: "v1",
                success: true,
                type: "QUESTION", // Assume it's answering or asking follow-ups
                action: "AI_RESPONSE",
                message: response.text() || "I am processing your request.",
                timestamp: Date.now(),
                traceId: newTraceId
            };

        } catch (error) {
            console.error("AI Service Error:", error);
            // Engage Safe Mode / Fallback Service
            return intentFallbackService.process(text, user, currentTraceId, error);
        }
    }
}

export default new AiService();
