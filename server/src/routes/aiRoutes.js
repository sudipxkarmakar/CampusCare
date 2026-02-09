import express from 'express';
import { handleChat } from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', handleChat);

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
