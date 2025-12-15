import express from 'express';
import { applyLeave, getMyLeaves, getMessMenu, getAllLeaves, updateLeaveStatus } from '../controllers/hostelController.js';

const router = express.Router();

router.post('/leave', applyLeave);
router.get('/leaves', getAllLeaves); // New route for mentors
router.put('/leave/:id', updateLeaveStatus); // New route for approval
router.get('/leave/:studentId', getMyLeaves);
router.get('/menu', getMessMenu);

export default router;
