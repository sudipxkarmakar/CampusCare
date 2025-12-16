import express from 'express';
import { createSubject, assignTeacherToSubject, getSubjects } from '../controllers/subjectController.js';

const router = express.Router();

router.post('/', createSubject);
router.post('/assign-teacher', assignTeacherToSubject);
router.get('/', getSubjects);

export default router;
