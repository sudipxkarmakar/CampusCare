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
    unassignSubjectTeacher,
    assignBatchMentor
} from '../controllers/hodController.js';
import { resolveComplaint } from '../controllers/wardenController.js';
import upload from '../middleware/uploadMiddleware.js';


const router = express.Router();

router.get('/dashboard', protect, hod, getHodDashboardStats);
router.get('/leaves', protect, hod, getPendingLeaves);
router.put('/leaves/:id/action', protect, hod, handleLeaveAction);
router.get('/students', protect, hod, getDepartmentStudents);
router.get('/teachers', protect, hod, getDepartmentTeachers);
router.get('/complaints', protect, hod, getDepartmentComplaints);
router.put('/complaints/:id/resolve', protect, hod, upload.single('resolutionImage'), resolveComplaint);

router.get('/routine', protect, hod, getRoutine);
router.post('/students/assign-mentor', protect, hod, assignMentor);
router.post('/subjects/:id/assign', protect, hod, assignSubjectTeacher);
router.post('/subjects/:id/unassign', protect, hod, unassignSubjectTeacher);
router.post('/batches/assign-mentor', protect, hod, assignBatchMentor);

export default router;
