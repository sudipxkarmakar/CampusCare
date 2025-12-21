import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAssignment, getAssignments, submitAssignment, getTeacherAssignments, getAssignmentSubmissions, deleteAssignment, updateSubmissionStatus } from '../controllers/assignmentController.js';

import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Using Multer Destination...');
        cb(null, path.join(__dirname, '../../../docs/uploads/assignments'));
    },
    filename: function (req, file, cb) {
        console.log('Multer Processing File:', file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'submission-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter (PDF Only)
const fileFilter = (req, file, cb) => {
    console.log('Multer Filtering:', file.mimetype);
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.error('Multer Rejected:', file.mimetype);
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

const router = express.Router();

router.post('/', protect, upload.single('file'), createAssignment);
router.get('/', protect, getAssignments);
router.get('/created', protect, getTeacherAssignments);
router.get('/:id/submissions', protect, getAssignmentSubmissions);
router.patch('/:id/submissions/:subId/status', protect, updateSubmissionStatus); // New route
router.post('/:id/submit', protect, (req, res, next) => {
    console.log(`[ROUTE] POST /:id/submit hit for ID: ${req.params.id}`);
    next();
}, upload.single('file'), submitAssignment);
router.delete('/:id', protect, deleteAssignment);

export default router;
