import express from 'express';
import { getMenteeLeaves, updateLeaveStatus } from '../controllers/leaveController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/mentees', protect, getMenteeLeaves);
router.put('/:id/status', protect, updateLeaveStatus);

export default router;
