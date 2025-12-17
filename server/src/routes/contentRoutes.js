import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect, teacher } from '../middleware/authMiddleware.js';
import { createAssignment, createNote, createNotice, getMyContent, getTeacherNotes, deleteNote } from '../controllers/contentController.js';
import { getTeacherAssignments, getAssignmentSubmissions } from '../controllers/assignmentController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer Storage (Assignment/Notes)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../../docs/uploads/assignments')); // Reuse assignments folder for now
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'note-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const router = express.Router();

router.post('/assignment', protect, teacher, createAssignment);
router.get('/assignment/created', protect, teacher, getTeacherAssignments); // NEW: Match frontend
router.get('/assignment/:id/submissions', protect, teacher, getAssignmentSubmissions); // NEW: Match frontend
router.post('/note', protect, teacher, upload.single('file'), createNote);
router.get('/note/created', protect, teacher, getTeacherNotes); // NEW: Match frontend
router.delete('/note/:id', protect, teacher, deleteNote); // NEW: Delete Note
router.post('/notice', protect, teacher, createNotice);
router.get('/my-content', protect, getMyContent);

export default router;
