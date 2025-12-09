import express from 'express';
import { fileComplaint, getComplaints, upvoteComplaint } from '../controllers/complaintController.js';

const router = express.Router();

router.post('/', fileComplaint);
router.get('/', getComplaints);
router.put('/:id/upvote', upvoteComplaint);

export default router;
