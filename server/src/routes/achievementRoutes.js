import express from 'express';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import {
    getAchievements,
    createAchievement,
    updateAchievement,
    getPendingAchievements,
    verifyAchievement,
    deleteAchievement,
} from '../controllers/achievementController.js';

const router = express.Router();

// Public: get all achievements (all statuses for authority, approved-only for others)
router.get('/', optionalProtect, getAchievements);

// Authenticated routes
router.post('/', protect, createAchievement);                      // teacher / hod / principal
router.put('/:id', protect, updateAchievement);                    // hod / principal
router.get('/pending', protect, getPendingAchievements);           // hod / principal
router.patch('/:id/verify', protect, verifyAchievement);           // hod / principal
router.delete('/:id', protect, deleteAchievement);                 // hod / principal

export default router;
