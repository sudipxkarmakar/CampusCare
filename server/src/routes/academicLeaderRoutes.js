import express from 'express';
import { getAcademicLeaders, createAcademicLeader, deleteAcademicLeader } from '../controllers/academicLeaderController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getAcademicLeaders);
router.post('/', protect, upload.single('image'), createAcademicLeader);
router.delete('/:id', protect, deleteAcademicLeader);

export default router;
