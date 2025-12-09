import express from 'express';
import { applyLeave, getMyLeaves, getMessMenu } from '../controllers/hostelController.js';

const router = express.Router();

router.post('/leave', applyLeave);
router.get('/leave/:studentId', getMyLeaves);
router.get('/menu', getMessMenu);

export default router;
