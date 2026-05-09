import Redis from 'ioredis';
import crypto from 'crypto';

export const DURATIONS = {
    LOCK_TTL_SECONDS: 15,
    WORKFLOW_TIMEOUT_MS: 30000,
    IDEMPOTENCY_TTL_DAYS: 30,
    AUDIT_RETENTION_DAYS: 90
};

const REDIS_SCHEMA = {
    SUPPORTED_VERSIONS: [1],
    CURRENT_VERSION: 1
};

// Best-effort sampled telemetry
const telemetryLastLogged = new Map();
function recordMetric(eventType, details = {}) {
    try {
        const now = Date.now();
        const last = telemetryLastLogged.get(eventType) || 0;
        if (now - last > 10000) { // Max 1 log per 10s per event type
            console.warn(`[TELEMETRY] ${eventType}`, details);
            telemetryLastLogged.set(eventType, now);
        }
    } catch (e) {
        // Telemetry must never crash the workflow
    }
}

class RedisManager {
    constructor() {
        this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        let lastErrorLogged = 0;
        this.client.on('error', (err) => {
            const now = Date.now();
            // Only log Redis errors once every 60 seconds to avoid spamming the console
            if (now - lastErrorLogged > 60000) {
                console.error('[Redis Error] Connection failed. AI state features may be degraded.', err.message);
                lastErrorLogged = now;
            }
        });
    }

    safeParseRedisJSON(data, typeContext) {
        if (!data) return null;
        try {
            const parsed = JSON.parse(data);
            if (typeof parsed !== "object" || parsed === null || typeof parsed.version !== "number" || !("payload" in parsed)) {
                recordMetric("redis_shape_mismatch", { context: typeContext });
                return null;
            }
            if (!REDIS_SCHEMA.SUPPORTED_VERSIONS.includes(parsed.version)) {
                recordMetric("redis_version_mismatch", { context: typeContext, found: parsed.version });
                return null; // Graceful degradation
            }
            return parsed.payload;
        } catch (e) {
            recordMetric("redis_parse_crash", { context: typeContext });
            return null;
        }
    }

    async getPendingAction(conversationId) {
        const data = await this.client.get(`v1:ai:pending:${conversationId}`);
        return this.safeParseRedisJSON(data, "pending_action");
    }

    async setPendingAction(conversationId, actionData) {
        const encapsulated = { version: REDIS_SCHEMA.CURRENT_VERSION, payload: actionData };
        await this.client.setex(`v1:ai:pending:${conversationId}`, 300, JSON.stringify(encapsulated));
    }

    async deletePendingAction(conversationId) {
        await this.client.del(`v1:ai:pending:${conversationId}`);
    }

    async acquireLock(conversationId) {
        const token = crypto.randomUUID();
        const result = await this.client.set(`v1:ai:lock:${conversationId}`, token, "NX", "EX", DURATIONS.LOCK_TTL_SECONDS);
        return result === "OK" ? token : null;
    }

    async extendLock(conversationId, token) {
        if (!token) return false;
        const script = `
            if redis.call("GET", KEYS[1]) == ARGV[1] then
                return redis.call("EXPIRE", KEYS[1], ARGV[2])
            else
                return 0
            end
        `;
        const result = await this.client.eval(script, 1, `v1:ai:lock:${conversationId}`, token, DURATIONS.LOCK_TTL_SECONDS);
        return result === 1;
    }

    async releaseLock(conversationId, token) {
        if (!token) return;
        const script = `
            if redis.call("GET", KEYS[1]) == ARGV[1] then
                return redis.call("DEL", KEYS[1])
            else
                return 0
            end
        `;
        await this.client.eval(script, 1, `v1:ai:lock:${conversationId}`, token);
    }

    async getHistory(conversationId) {
        const data = await this.client.get(`v1:ai:history:${conversationId}`);
        return this.safeParseRedisJSON(data, "history") || [];
    }

    async saveHistory(conversationId, historyArray) {
        const trimmed = historyArray.slice(-20);
        const encapsulated = { version: REDIS_SCHEMA.CURRENT_VERSION, payload: trimmed };
        const serialized = JSON.stringify(encapsulated);
        
        if (Buffer.byteLength(serialized, 'utf8') > 50000) {
            console.warn("[CRITICAL] Redis History exceeded 50KB limit despite sanitization. Force truncating.");
            const ultraTrimmed = historyArray.slice(-5);
            const ultraEncapsulated = { version: REDIS_SCHEMA.CURRENT_VERSION, payload: ultraTrimmed };
            await this.client.setex(`v1:ai:history:${conversationId}`, 86400, JSON.stringify(ultraEncapsulated));
            return;
        }

        await this.client.setex(`v1:ai:history:${conversationId}`, 86400, serialized);
    }
}

export default new RedisManager();
