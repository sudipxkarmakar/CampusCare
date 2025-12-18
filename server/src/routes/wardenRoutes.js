import express from 'express';
import { protect, warden } from '../middleware/authMiddleware.js';
import {
    getWardenDashboardStats,
    getPendingLeaves,
    handleLeaveAction,
    updateMessMenu,
    getHostelers,
    getMessMenu,
    getHostelComplaints,
    resolveComplaint,
    escalateComplaint
} from '../controllers/wardenController.js';

const router = express.Router();

router.get('/dashboard', protect, warden, getWardenDashboardStats);
router.get('/leaves', protect, warden, getPendingLeaves);
router.put('/leaves/:id/action', protect, warden, handleLeaveAction);
router.put('/mess', protect, warden, updateMessMenu);
router.get('/mess', protect, warden, getMessMenu);
router.get('/students', protect, warden, getHostelers);

// Complaint Management
router.get('/complaints', protect, warden, getHostelComplaints);
router.put('/complaints/:id/resolve', protect, warden, resolveComplaint);
router.put('/complaints/:id/escalate', protect, warden, escalateComplaint);

export default router;
