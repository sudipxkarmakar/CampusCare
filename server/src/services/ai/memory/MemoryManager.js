export class MemoryManager {
    static _coreSanitize(history, allowedRoles) {
        if (!Array.isArray(history)) return [];
        if (history.length > 100) {
            console.warn("[MemoryManager] History exceeds 100 turns. Truncating heavily before serialization.");
            history = history.slice(-50); 
        }

        const safeHistory = history.filter(h => 
            allowedRoles.includes(h.role)
        ).map(h => {
            const safe = {
                role: h.role,
                content: typeof h.content === 'string' ? h.content : (h.parts && h.parts[0]?.text ? h.parts[0].text : "")
            };
            
            // Preserve tool call metadata if present
            if (h.tool_calls) safe.tool_calls = h.tool_calls;
            if (h.tool_call_id) safe.tool_call_id = h.tool_call_id;
            if (h.name) safe.name = h.name;

            return safe;
        });

        return safeHistory.slice(-20); // Keep last 20 turns
    }

    static sanitizeFrontendHistory(history) {
        return this._coreSanitize(history, ["user", "assistant"]);
    }

    static sanitizeRedisHistory(history) {
        return this._coreSanitize(history, ["user", "assistant", "tool", "system"]);
    }
}
