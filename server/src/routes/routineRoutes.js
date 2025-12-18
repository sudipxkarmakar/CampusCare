import express from 'express';
import { getStudentRoutine, getTeacherRoutine, updateRoutineSlot, deleteRoutineSlot } from '../controllers/routineController.js';
// import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/student', getStudentRoutine);
router.get('/teacher', getTeacherRoutine);
router.post('/', updateRoutineSlot);
router.delete('/', deleteRoutineSlot);

export default router;
