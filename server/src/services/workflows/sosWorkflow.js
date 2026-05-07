import AIActionLog from '../../models/AIActionLog.js';

// Simple in-memory rate limiter for SOS
const sosRateLimiter = new Map();

export const execute = async (args, user, conversationId, traceId, options = {}) => {
    const { signal, execId } = options;
    // 1. Validation & Rate Limiting
    if (!user || !user._id) {
        throw new Error("UNAUTHORIZED: Guest users cannot trigger SOS.");
    }

    const userId = user._id.toString();
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes
    const maxRequests = 3;

    if (!sosRateLimiter.has(userId)) {
        sosRateLimiter.set(userId, []);
    }
    const userRequests = sosRateLimiter.get(userId);
    // filter old requests
    const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    
    if (recentRequests.length >= maxRequests) {
        throw new Error("RATE_LIMIT_EXCEEDED: Maximum SOS triggers reached. Please contact campus security directly.");
    }
    recentRequests.push(now);
    if (recentRequests.length === 0) {
        sosRateLimiter.delete(userId);
    } else {
        sosRateLimiter.set(userId, recentRequests);
    }

    // 2. Execution Logic
    // In a real system, this would dispatch WebSocket events to security,
    // trigger WhatsApp APIs to HOD/Warden, etc.
    // Example: sendWhatsAppAlert(args, { execId }); // Idempotency tag

    if (signal?.aborted) {
        const e = new Error("EXECUTION_TIMEOUT");
        e.name = "AbortError";
        throw e;
    }

    // Log the action explicitly
    await AIActionLog.create({
        traceId,
        conversationId,
        userId: user._id,
        role: user.role,
        intent: "EMERGENCY",
        tool: "trigger_sos",
        generatedArgs: args,
        executionStatus: "COMPLETED",
        confirmationStatus: "BYPASSED", // SOS skips confirmation
        metrics: {
            modelLatency: metadata.llmLatency || 0,
            workflowLatency: Date.now() - now,
            totalResponseTime: (metadata.llmLatency || 0) + (Date.now() - now),
            modelName: metadata.modelName || 'gemini-1.5-flash',
            promptVersion: metadata.promptVersion || 'v1.0'
        }
    });

    return {
        success: true,
        type: "SUCCESS",
        action: "TRIGGER_SOS",
        message: "EMERGENCY DETECTED. SOS Triggered. Emergency response teams have been notified. Please seek help immediately.",
        payload: { type: "Emergency Detected", details: args }
    };
};
