import express from 'express';
import { fileComplaint, getComplaints, upvoteComplaint, getMenteeComplaints, updateComplaintStatus, upliftComplaint, getMyComplaints, correctComplaint } from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', fileComplaint); // Ideally protected
router.get('/', getComplaints);
router.put('/:id/upvote', protect, upvoteComplaint);
router.get('/mentees', protect, getMenteeComplaints);
router.put('/:id/status', protect, updateComplaintStatus);
router.put('/:id/uplift', protect, upliftComplaint);
router.put('/:id/correct', protect, correctComplaint);
router.get('/my', protect, getMyComplaints);

export default router;
