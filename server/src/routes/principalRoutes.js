import express from 'express';
import { protect, principal } from '../middleware/authMiddleware.js';
import {
    getPrincipalDashboardStats,
    getAllStaff,
    resolveComplaintDirectly
} from '../controllers/principalController.js';

const router = express.Router();

router.get('/dashboard', protect, principal, getPrincipalDashboardStats);
router.get('/staff', protect, principal, getAllStaff);
router.put('/complaints/:id/resolve', protect, principal, resolveComplaintDirectly);

export default router;
