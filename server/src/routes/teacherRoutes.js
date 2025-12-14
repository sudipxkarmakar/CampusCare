import express from 'express';
import { getMyMentees } from '../controllers/teacherController.js';
import { protect, teacher } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-mentees', protect, teacher, getMyMentees);

export default router;
