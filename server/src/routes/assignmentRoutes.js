import express from 'express';
import { createAssignment, getAssignments } from '../controllers/assignmentController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createAssignment);
router.get('/', protect, getAssignments);

export default router;
