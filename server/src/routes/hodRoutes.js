import express from 'express';
import { protect, hod } from '../middleware/authMiddleware.js';
import {
    getHodDashboardStats,
    getPendingLeaves,
    handleLeaveAction,
    getDepartmentStudents,
    getDepartmentTeachers,
    getDepartmentComplaints,
    getRoutine,
    assignMentor,
    assignSubjectTeacher,
    unassignSubjectTeacher
} from '../controllers/hodController.js';

const router = express.Router();

router.get('/dashboard', protect, hod, getHodDashboardStats);
router.get('/leaves', protect, hod, getPendingLeaves);
router.put('/leaves/:id/action', protect, hod, handleLeaveAction);
router.get('/students', protect, hod, getDepartmentStudents);
router.get('/teachers', protect, hod, getDepartmentTeachers);
router.get('/complaints', protect, hod, getDepartmentComplaints);
router.get('/routine', protect, hod, getRoutine);
router.post('/students/assign-mentor', protect, hod, assignMentor);
router.post('/subjects/:id/assign', protect, hod, assignSubjectTeacher);
router.post('/subjects/:id/unassign', protect, hod, unassignSubjectTeacher);

export default router;
