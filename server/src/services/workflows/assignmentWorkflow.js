import { validate } from '../../validators/assignmentValidator.js';

export const execute = async (args, user, conversationId, traceId, options = {}) => {
    const { signal, execId } = options;
    // 1. Authorization
    if (!user || user.role !== 'teacher') {
        throw new Error("UNAUTHORIZED: Only teachers can create assignments.");
    }

    // 2. Validation
    const validation = validate(args, user);
    if (!validation.success) {
        throw new Error(`VALIDATION_ERROR: ${validation.message}`);
    }

    if (signal?.aborted) {
        const e = new Error("EXECUTION_TIMEOUT");
        e.name = "AbortError";
        throw e;
    }

    // Example of a backend-enforced validation policy
    // In a full implementation, you would use validators/assignmentValidator.js here
    // to ensure user is assigned to args.subject.

    return {
        success: true,
        type: "REDIRECT",
        action: "REDIRECT_ASSIGNMENT",
        message: "I have successfully prepared the assignment details. Redirecting you to the Assignment form...",
        payload: args
    };
};

export const executeSubmit = async (args, user, conversationId, traceId, options = {}) => {
    const { signal } = options;
    
    if (!user || user.role !== 'student') {
        throw new Error("UNAUTHORIZED: Only students can submit assignments.");
    }

    if (signal?.aborted) {
        const e = new Error("EXECUTION_TIMEOUT");
        e.name = "AbortError";
        throw e;
    }

    return {
        success: true,
        type: "REDIRECT",
        action: "REDIRECT_SUBMIT_ASSIGNMENT",
        message: `I have found your ${args.subject} assignment. Redirecting you to the submission page...`,
        payload: {
            subject: args.subject,
            assignmentId: args.assignmentId,
            notes: args.notes
        }
    };
};
