import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileComplaint, getComplaints, upvoteComplaint, getMenteeComplaints, updateComplaintStatus, upliftComplaint, getMyComplaints, correctComplaint } from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
router.post('/', upload.single('image'), fileComplaint); // Ideally protected
router.get('/', getComplaints);
router.put('/:id/upvote', protect, upvoteComplaint);
router.get('/mentees', protect, getMenteeComplaints);
router.put('/:id/status', protect, updateComplaintStatus);
router.put('/:id/uplift', protect, upliftComplaint);
router.put('/:id/correct', protect, correctComplaint);
router.get('/my', protect, getMyComplaints);

export default router;
