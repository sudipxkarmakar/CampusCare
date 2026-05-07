import express from 'express';
import rateLimit from "express-rate-limit";
import { handleChat, handleGenerateComplaint } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

export const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 requests per `window` (here, per minute)
    message: {
        error: "Too many AI requests. Please slow down."
    }
});

// Protected chat route
router.post('/chat', protect, aiLimiter, handleChat);
router.post('/generate-complaint', protect, aiLimiter, handleGenerateComplaint);

import { analyzeComplaint } from '../utils/aiService.js';
router.get('/test', async (req, res) => {
    try {
        const result = await analyzeComplaint("FIRE IN LOBBY");
        res.json({ message: "ML Test Result", result });
    } catch (error) {
        res.status(500).json({ message: "ML Test Failed", error: error.message });
    }
});

export default router;
