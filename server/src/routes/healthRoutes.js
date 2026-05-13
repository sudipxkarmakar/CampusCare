import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Liveness Probe (Process is alive and responding to HTTP)
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

// Readiness Probe (Dependencies are connected and healthy)
router.get('/ready', async (req, res) => {
    try {
        // Check MongoDB with timeout
        const mongoCheck = new Promise((resolve, reject) => {
            if (mongoose.connection.readyState === 1) resolve();
            else reject(new Error('MongoDB disconnected'));
        });

        try {
            await Promise.race([mongoCheck, timeout(2000)]);
        } catch (e) {
            return res.status(503).json({ status: 'unavailable', reason: 'MongoDB disconnected or timed out' });
        }

        res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(503).json({ status: 'unavailable', reason: error.message });
    }
});

export default router;
