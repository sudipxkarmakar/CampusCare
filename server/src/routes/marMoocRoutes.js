
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getStudentMarMoocs, submitMarMooc } from '../controllers/marMoocController.js';

const router = express.Router();

router.get('/', protect, getStudentMarMoocs);
router.post('/', protect, submitMarMooc);

export default router;
