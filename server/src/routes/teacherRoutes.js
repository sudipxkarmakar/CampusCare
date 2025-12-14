import express from 'express';
import { getMyMentees, getMenteeIssues } from '../controllers/teacherController.js';
import { protect, teacher } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-mentees', protect, teacher, getMyMentees);
router.get('/mentee-issues', protect, teacher, getMenteeIssues);

export default router;
