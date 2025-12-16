import express from 'express';
import { getStudentRoutine, getTeacherRoutine, createRoutine } from '../controllers/routineController.js';
// import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/student', getStudentRoutine);
router.get('/teacher', getTeacherRoutine);
router.post('/', createRoutine);

export default router;
