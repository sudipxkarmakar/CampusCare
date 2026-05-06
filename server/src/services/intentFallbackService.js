export class IntentFallbackService {
    
    // Priorities based on structural match. Emergency has highest priority.
    process(text, user, traceId, error = null) {
        const lowerText = text.toLowerCase();
        
        const baseResponse = {
            version: "v1",
            timestamp: Date.now(),
            traceId: traceId || `AI-FALLBACK-${crypto.randomUUID()}`
        };
        
        // 1. EMERGENCY (Highest Priority)
        const emergencyKeywords = ['\\bfracture\\b', '\\bbleeding\\b', '\\binjured\\b', '\\bfire\\b', '\\bheart attack\\b', '\\bemergency\\b', '\\baccident\\b'];
        if (emergencyKeywords.some(kw => new RegExp(kw, 'i').test(lowerText))) {
            if (!user || !user._id) {
                return {
                    ...baseResponse,
                    success: false,
                    type: "ERROR",
                    action: "AI_RESPONSE",
                    message: "Emergency detected, but you are not logged in. Please contact campus security directly at 911."
                };
            }
            return {
                ...baseResponse,
                success: true,
                type: "WARNING",
                action: "TRIGGER_SOS",
                message: "SOS Triggered locally due to API high demand. Emergency teams are notified. Please seek help immediately.",
                payload: { type: "Emergency Detected" }
            };
        }
        
        // 2. COMPLAINT
        const complaintKeywords = ['ragging', 'complain', 'issue', 'broken'];
        if (complaintKeywords.some(kw => lowerText.includes(kw))) {
            if (!user || !user._id) {
                return {
                    ...baseResponse,
                    success: false,
                    type: "ERROR",
                    action: "AI_RESPONSE",
                    message: "Please log in to submit a complaint."
                };
            }
            return {
                ...baseResponse,
                success: true,
                type: "REDIRECT",
                action: "PREFILL_COMPLAINT",
                message: "I have drafted your complaint locally. Redirecting you to the form...",
                payload: { title: "Campus Complaint", description: text }
            };
        }

        // 3. ASSIGNMENT
        const assignmentKeywords = ['assignment', 'homework'];
        if (assignmentKeywords.some(kw => lowerText.includes(kw))) {
            if (!user || user.role !== 'teacher') {
                return {
                    ...baseResponse,
                    success: false,
                    type: "ERROR",
                    action: "AI_RESPONSE",
                    message: "You are not authorized to manage assignments."
                };
            }
            return { 
                ...baseResponse,
                success: true,
                type: "INFO",
                action: "AI_RESPONSE", 
                message: "I'm currently running in offline mode. Please check your Dashboard to submit or view assignments."
            };
        }

        // Default Fallback
        let fallbackMessage = "Hello! My AI brain is currently experiencing high demand and is temporarily offline. My critical emergency features remain active, but for complex requests, please try again later.";
        
        if (error && error.status === 429) {
            fallbackMessage = "API Rate Limit Exceeded. You have made too many rapid requests. Please wait a minute before trying again.";
        }

        return {
            ...baseResponse,
            success: true,
            type: "SYSTEM",
            action: "AI_RESPONSE",
            message: fallbackMessage
        };
    }
}

export default new IntentFallbackService();
