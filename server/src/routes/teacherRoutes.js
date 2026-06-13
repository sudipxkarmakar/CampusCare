import express from 'express';
import { getMyMentees, getMenteeIssues, getAllStudents } from '../controllers/teacherController.js';
import { protect, teacher } from '../middleware/authMiddleware.js';
import { resolveComplaint } from '../controllers/wardenController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

console.log('Teacher Routes Loaded'); // Debugging check

router.get('/my-mentees', protect, teacher, getMyMentees);
router.get('/mentee-issues', protect, teacher, getMenteeIssues);
router.get('/all-students', protect, teacher, getAllStudents);
router.put('/complaints/:id/resolve', protect, teacher, upload.single('resolutionImage'), resolveComplaint);

export default router;
