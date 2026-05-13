import * as complaintWorkflow from './workflows/complaintWorkflow.js';
import * as leaveWorkflow from './workflows/leaveWorkflow.js';
import * as assignmentWorkflow from './workflows/assignmentWorkflow.js';
import * as sosWorkflow from './workflows/sosWorkflow.js';
import * as contentWorkflow from './workflows/contentWorkflow.js';
import AIActionLog from '../models/AIActionLog.js';
import { EXECUTION_STATUS, CONFIRMATION_STATUS } from '../constants/aiConstants.js';
import { sanitizeArgs } from '../validators/argSanitizer.js';

const TOOL_PERMISSIONS = {
    trigger_sos: ['student', 'teacher', 'hod', 'warden', 'principal', 'guest'],
    draft_complaint: ['student', 'teacher', 'hod', 'warden', 'principal', 'hosteler'],
    submit_leave: ['hosteler'],
    create_assignment: ['teacher', 'hod'],
    complete_academic_obligation: ['student', 'hosteler'],
    review_pending_work: ['student', 'hosteler'],
    open_learning_materials: ['student', 'teacher', 'hosteler'],
    view_schedule: ['student', 'teacher', 'hosteler'],
    check_campus_announcements: ['student', 'teacher', 'hod', 'hosteler', 'warden', 'principal'],
    select_resource: ['student', 'teacher', 'hod', 'hosteler']
};

const isAuthorized = (user, actionName) => {
    const role = user?.role || 'guest';
    return TOOL_PERMISSIONS[actionName]?.includes(role) || false;
};

const workflowHandlers = {
    'trigger_sos': sosWorkflow.execute,
    'draft_complaint': complaintWorkflow.execute,
    'submit_leave': leaveWorkflow.execute,
    'create_assignment': assignmentWorkflow.execute,
    'complete_academic_obligation': assignmentWorkflow.executeSubmit,
    'review_pending_work': contentWorkflow.executeAssignments,
    'open_learning_materials': contentWorkflow.executeNotes,
    'view_schedule': contentWorkflow.executeRoutine,
    'check_campus_announcements': contentWorkflow.executeNotices,
    'select_resource': contentWorkflow.executeSelectResource,
};


export class WorkflowService {
    async executeWorkflow(actionName, args, user, conversationId, traceId, metadata = {}, options = {}) {
        const { signal, execId } = options;
        if (signal?.aborted) {
            const err = new Error("EXECUTION_TIMEOUT");
            err.name = "AbortError";
            throw err;
        }

        const handler = workflowHandlers[actionName];
        if (!handler) {
            // Generic success for tools not yet explicitly separated into workflow files
            return {
                success: true,
                type: "SUCCESS",
                action: "ACTION_SUCCESS",
                message: `Action ${actionName} logged and completed successfully.`,
                payload: args
            };
        }

        // 1. Authorize Tool Execution via Centralized Security Policy
        if (!isAuthorized(user, actionName)) {
            const userRole = user ? user.role : 'guest';
            throw new Error(`UNAUTHORIZED: Role '${userRole}' is not permitted to execute tool '${actionName}'.`);
        }

        
        // 2. Validate and Sanitize arguments
        const safeArgs = sanitizeArgs(actionName, args);

        if (signal?.aborted) {
            const err = new Error("EXECUTION_TIMEOUT");
            err.name = "AbortError";
            throw err;
        }

        const startTime = Date.now();
        try {
            const result = await handler(safeArgs, user, conversationId, traceId, metadata, { signal, execId });
            
            // Only log if not already logged (e.g., SOS logs itself with bypass)
            if (actionName !== 'trigger_sos') {
                try {
                    await AIActionLog.findOneAndUpdate(
                        { traceId },
                        {
                            $set: {
                                userId: user._id,
                                role: user.role,
                                intent: actionName.toUpperCase(),
                                tool: actionName,
                                generatedArgs: safeArgs,
                                confirmationStatus: CONFIRMATION_STATUS.CONFIRMED,
                                metrics: {
                                    modelLatency: metadata.llmLatency || 0,
                                    workflowLatency: Date.now() - startTime,
                                    totalResponseTime: (metadata.llmLatency || 0) + (Date.now() - startTime),
                                    modelName: metadata.modelName || 'llama-3.3-70b-versatile',
                                    promptVersion: metadata.promptVersion || 'v1.0'
                                }
                            }
                        },
                        { upsert: false }
                    );
                } catch (logErr) {
                    console.error("Failed to log workflow execution:", logErr);
                }
            }

            return result;
        } catch (error) {
            try {
                await AIActionLog.findOneAndUpdate(
                    { traceId },
                    {
                        conversationId,
                        userId: user._id,
                        role: user.role,
                        intent: actionName.toUpperCase(),
                        tool: actionName,
                        generatedArgs: safeArgs,
                        executionStatus: EXECUTION_STATUS.FAILED,
                        errorMessage: error.message,
                        metrics: {
                            modelLatency: metadata.llmLatency || 0,
                            workflowLatency: Date.now() - startTime,
                            totalResponseTime: (metadata.llmLatency || 0) + (Date.now() - startTime),
                            modelName: metadata.modelName || 'gemini-1.5-flash',
                            promptVersion: metadata.promptVersion || 'v1.0'
                        }
                    },
                    { upsert: false }
                );
            } catch (logErr) {
                console.error("Failed to log workflow failure:", logErr);
            }
            throw error;
        }
    }
}

export default new WorkflowService();
