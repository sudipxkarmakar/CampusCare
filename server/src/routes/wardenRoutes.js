import express from 'express';
import { protect, warden } from '../middleware/authMiddleware.js';
import {
    getWardenDashboardStats,
    getPendingLeaves,
    handleLeaveAction,
    updateMessMenu,
    getHostelers
} from '../controllers/wardenController.js';

const router = express.Router();

router.get('/dashboard', protect, warden, getWardenDashboardStats);
router.get('/leaves', protect, warden, getPendingLeaves);
router.put('/leaves/:id/action', protect, warden, handleLeaveAction);
router.put('/mess', protect, warden, updateMessMenu);
router.get('/students', protect, warden, getHostelers);

export default router;
