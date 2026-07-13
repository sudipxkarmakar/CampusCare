import rateLimit from "express-rate-limit";
import AIKernel from "./AIKernel.js";

export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: "Too many AI requests. Please slow down." }
});

export const AIGateway = async (req, res, next) => {
    // 1. Auth check middleware block
    if (!req.user) {
        return res.status(401).json({ error: "UNAUTHORIZED: Must be logged in." });
    }

    // 2. Request Loader & Tracing Context Setup
    const traceId = `AI-TR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    req.aiContext = {
        user: req.user,
        traceId,
        startTime: Date.now(),
        clientContext: req.body.clientContext || {}
    };

    next();
};
