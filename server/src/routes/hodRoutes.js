import express from 'express';
import { protect, hod } from '../middleware/authMiddleware.js';
import {
    getHodDashboardStats,
    getPendingLeaves,
    handleLeaveAction
} from '../controllers/hodController.js';

const router = express.Router();

router.get('/dashboard', protect, hod, getHodDashboardStats);
router.get('/leaves', protect, hod, getPendingLeaves);
router.put('/leaves/:id/action', protect, hod, handleLeaveAction);

export default router;
