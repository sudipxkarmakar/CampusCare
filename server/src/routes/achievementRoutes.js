import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getAchievements,
    createAchievement,
    getPendingAchievements,
    verifyAchievement,
    deleteAchievement,
} from '../controllers/achievementController.js';

const router = express.Router();

// Public: get all approved achievements
router.get('/', getAchievements);

// Authenticated routes
router.post('/', protect, createAchievement);                      // teacher / hod / principal
router.get('/pending', protect, getPendingAchievements);           // hod / principal
router.patch('/:id/verify', protect, verifyAchievement);           // hod / principal
router.delete('/:id', protect, deleteAchievement);                 // principal only

export default router;
