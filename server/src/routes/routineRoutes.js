import express from 'express';
import { getStudentRoutine, getTeacherRoutine, updateRoutineSlot, deleteRoutineSlot } from '../controllers/routineController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/student', protect, getStudentRoutine);
router.get('/teacher', protect, getTeacherRoutine);
router.post('/', updateRoutineSlot);
router.delete('/', deleteRoutineSlot);

export default router;
