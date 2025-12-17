import express from 'express';
import { createSubject, assignTeacherToSubject, getSubjects, deleteSubject } from '../controllers/subjectController.js';

const router = express.Router();

router.post('/', createSubject);
router.post('/assign-teacher', assignTeacherToSubject);
router.get('/', getSubjects);
router.delete('/:id', deleteSubject);

export default router;
