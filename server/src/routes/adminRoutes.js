import express from 'express';
import { assignMentor, promoteToHOD, getDeptUsers, getAllStudents } from '../controllers/adminController.js';
import { protect, admin, hod } from '../middleware/authMiddleware.js';

const router = express.Router();

// For prototype, ignoring auth middleware validation for now to speed up manual testing
// In prod, use: router.post('/assign-mentor', protect, admin, assignMentor);

router.post('/assign-mentor', assignMentor); // Open for now as per prev code
router.post('/promote-hod', promoteToHOD);
router.get('/dept/:dept', getDeptUsers);

// Protected Route for HOD to see entire student DB
router.get('/students', protect, hod, getAllStudents);

export default router;
