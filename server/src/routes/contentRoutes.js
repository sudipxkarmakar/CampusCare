import express from 'express';
import { protect, teacher } from '../middleware/authMiddleware.js';
import { createAssignment, createNote, createNotice, getMyContent } from '../controllers/contentController.js';
import { getTeacherAssignments, getAssignmentSubmissions } from '../controllers/assignmentController.js';

const router = express.Router();

router.post('/assignment', protect, teacher, createAssignment);
router.get('/assignment/created', protect, teacher, getTeacherAssignments); // NEW: Match frontend
router.get('/assignment/:id/submissions', protect, teacher, getAssignmentSubmissions); // NEW: Match frontend
router.post('/note', protect, teacher, createNote);
router.post('/notice', protect, teacher, createNotice);
router.get('/my-content', protect, getMyContent);

export default router;
