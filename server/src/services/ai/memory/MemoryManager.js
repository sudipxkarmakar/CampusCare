export class MemoryManager {
    static _coreSanitize(history, allowedRoles) {
        if (!Array.isArray(history)) return [];
        if (history.length > 100) {
            console.warn("[MemoryManager] History exceeds 100 turns. Truncating heavily before serialization.");
            history = history.slice(-50); // Cheap prefilter before serialization
        }

        const safeHistory = history.filter(h => 
            allowedRoles.includes(h.role) && 
            (
                (Array.isArray(h.parts) && h.parts.length > 0 && typeof h.parts[0]?.text === 'string') ||
                typeof h.content === 'string'
            )
        ).map(h => {
            let text = h.content || h.parts[0].text;
            
            // Canonicalize
            try {
                text = text.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase().trim();
            } catch (err) {
                console.warn("[MemoryManager] Unicode normalization failed. Dropping payload text.");
                text = "";
            }
            
            // Deep scrub XML/JSON tags that could spoof context
            const scrubbedText = text.replace(/<assistant>/gi, '')
                                     .replace(/<user>/gi, '')
                                     .replace(/\[system\]/gi, '')
                                     .replace(/function_call:/gi, '');

            return {
                role: h.role, // Preserve role mapping
                content: scrubbedText
            };
        });

        // 1. Enforce Byte Size Limits AFTER extracting safe primitives to prevent JSON stringify explosion
        try {
            const serialized = JSON.stringify(safeHistory);
            const byteSize = Buffer.byteLength(serialized, 'utf8');
            if (byteSize > 50000) { 
                throw new Error("Payload Too Large: History exceeds maximum byte size limits.");
            }
        } catch(err) {
            console.error("Failed to stringify history", err);
            return []; // Fail safe
        }
        
        return safeHistory.slice(-15); // Sliding window fallback
    }

    static sanitizeFrontendHistory(history) {
        return this._coreSanitize(history, ["user"]);
    }

    static sanitizeRedisHistory(history) {
        return this._coreSanitize(history, ["user", "assistant"]);
    }
}
