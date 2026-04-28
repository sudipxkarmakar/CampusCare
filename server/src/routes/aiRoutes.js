import express from 'express';
import { handleChat, handleGenerateComplaint } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected chat route
router.post('/chat', protect, handleChat);
router.post('/generate-complaint', protect, handleGenerateComplaint);

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
