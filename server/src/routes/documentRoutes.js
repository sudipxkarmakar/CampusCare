
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadDocument, getMyDocuments, deleteDocument } from '../controllers/documentController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();


// Configure Multer Storage for Documents
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../../docs/uploads/documents'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter (PDFs and Images)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// Routes
router.post('/', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getMyDocuments);
router.delete('/:id', protect, deleteDocument);

export default router;
