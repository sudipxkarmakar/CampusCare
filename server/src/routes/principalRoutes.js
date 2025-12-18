import express from 'express';
import { protect, principal } from '../middleware/authMiddleware.js';
import {
    getPrincipalDashboardStats,
    getAllStaff,
    resolveComplaintDirectly,
    getAllStudents,
    getAllTeachers
} from '../controllers/principalController.js';

const router = express.Router();

router.get('/dashboard', protect, principal, getPrincipalDashboardStats);
router.get('/staff', protect, principal, getAllStaff);
router.get('/students', protect, principal, getAllStudents);
router.get('/teachers', protect, principal, getAllTeachers);
router.put('/complaints/:id/resolve', protect, principal, resolveComplaintDirectly);

export default router;
