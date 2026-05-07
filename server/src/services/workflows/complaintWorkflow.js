export const execute = async (args, user, conversationId, traceId, options = {}) => {
    const { signal, execId } = options;
    // 1. Validation
    if (!user) {
        throw new Error("UNAUTHORIZED: Must be logged in to draft complaints.");
    }

    // 2. Execution logic - For complaints, we currently just redirect to the form
    // The actual DB save happens when they submit the form on the frontend.
    if (signal?.aborted) {
        const e = new Error("EXECUTION_TIMEOUT");
        e.name = "AbortError";
        throw e;
    }
    
    return {
        success: true,
        type: "REDIRECT",
        action: "PREFILL_COMPLAINT",
        message: "I have prepared your complaint draft. Redirecting you to the form for final submission...",
        payload: { 
            title: args.title || "Campus Complaint", 
            description: args.description || "Please detail your complaint here.",
            category: args.category || "Other",
            priority: args.priority || "Medium",
            department: args.department || ""
        }
    };
};
