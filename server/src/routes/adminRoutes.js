import express from 'express';
import { assignMentor, promoteToHOD, getDeptUsers } from '../controllers/adminController.js';
// import { protect, admin } from '../middleware/authMiddleware.js'; // TODO: Middleware later

const router = express.Router();

// For prototype, ignoring auth middleware validation for now to speed up manual testing
// In prod, use: router.post('/assign-mentor', protect, admin, assignMentor);

router.post('/assign-mentor', assignMentor);
router.post('/promote-hod', promoteToHOD);
router.get('/dept/:dept', getDeptUsers);

export default router;
