import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getMessMenu, updateMessMenu, applyLeave, getMyLeaves } from '../controllers/hostelController.js';

const router = express.Router();

router.get('/mess', getMessMenu);
router.put('/mess', protect, admin, updateMessMenu); // Dean/Admin
router.post('/leave', protect, applyLeave);
router.get('/my-leaves', protect, getMyLeaves);

export default router;
