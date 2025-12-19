import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createNote, getNotes, getTeacherNotes, deleteNote } from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- Multer Config for Notes ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure this directory exists or create it. 
        // For now Assuming docs/uploads/notes exists or will be created.
        // If shared with assignments, adjust path.
        // Let's use a distinct folder 'notes'
        cb(null, path.join(__dirname, '../../../docs/uploads/notes'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'note-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type for notes'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- Routes ---
router.post('/', protect, upload.single('file'), createNote);
router.get('/', protect, getNotes);
router.get('/created', protect, getTeacherNotes);
router.delete('/:id', protect, deleteNote);

export default router;
