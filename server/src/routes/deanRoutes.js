import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js'; // Assuming admin covers dean for now or I add dean
import { getHostelStats, getHostelComplaints, getHostelLeaves, manageHostelLeave } from '../controllers/deanController.js';

const router = express.Router();

// Dean is essentially Admin for Hostel module
router.get('/stats', protect, admin, getHostelStats);
router.get('/complaints', protect, admin, getHostelComplaints);
router.get('/leaves', protect, admin, getHostelLeaves);
router.put('/leave/:id', protect, admin, manageHostelLeave);

export default router;
