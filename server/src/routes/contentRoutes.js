import express from 'express';
import { protect, teacher } from '../middleware/authMiddleware.js';
import { createAssignment, createNote, createNotice, getMyContent } from '../controllers/contentController.js';

const router = express.Router();

router.post('/assignment', protect, teacher, createAssignment);
router.post('/note', protect, teacher, createNote);
router.post('/notice', protect, teacher, createNotice);
router.get('/my-content', protect, getMyContent);

export default router;
