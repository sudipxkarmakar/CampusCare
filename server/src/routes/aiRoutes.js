import express from 'express';
import rateLimit from "express-rate-limit";
import { handleChat, handleGenerateComplaint, handleGenerateNotice, handleGetStatus, handleGenerateLeaderMessage } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

export const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 requests per `window` (here, per minute)
    message: {
        error: "Too many AI requests. Please slow down."
    }
});

// Protected routes
router.post('/chat', protect, aiLimiter, handleChat);
router.post('/generate-complaint', protect, aiLimiter, handleGenerateComplaint);
router.post('/generate-notice', protect, aiLimiter, handleGenerateNotice);
router.post('/generate-leader-message', protect, aiLimiter, handleGenerateLeaderMessage);
router.get('/status/:conversationId', protect, handleGetStatus);

export default router;
