import { validate } from '../../validators/assignmentValidator.js';

export const execute = async (args, user, conversationId, traceId, metadata = {}, options = {}) => {
    const { signal, execId } = options;
    if (!user || user.role !== 'teacher') {
        throw new Error("UNAUTHORIZED: Only faculty can define academic tasks.");
    }

    const validation = validate(args, user);
    if (!validation.success) {
        throw new Error(`VALIDATION_ERROR: ${validation.message}`);
    }

    if (signal?.aborted) {
        const e = new Error("EXECUTION_TIMEOUT");
        e.name = "AbortError";
        throw e;
    }

    return {
        success: true,
        presentationState: "SUCCESS",
        type: "REDIRECT",
        action: "REDIRECT_ASSIGNMENT",
        message: "I have prepared the academic task definition. Redirecting to the formal interface...",
        payload: args
    };
};

export const executeSubmit = async (args, user, conversationId, traceId, metadata = {}, options = {}) => {
    const { signal } = options;
    
    if (!user || user.role !== 'student') {
        throw new Error("UNAUTHORIZED: Access restricted to authorized students.");
    }

    if (signal?.aborted) {
        const e = new Error("EXECUTION_TIMEOUT");
        e.name = "AbortError";
        throw e;
    }

    return {
        success: true,
        presentationState: "SUCCESS",
        type: "REDIRECT",
        action: "REDIRECT_SUBMIT_ASSIGNMENT",
        message: `I have identified the academic obligation for ${args.subject}. Redirecting to the completion portal...`,
        payload: {
            subject: args.subject,
            assignmentTitle: args.assignmentTitle,
            assignmentId: args.assignmentId,
            notes: args.notes
        }
    };
};
