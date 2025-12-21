
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getStudentMarMoocs,
    submitMarMooc,
    getMenteeSubmissions,
    updateMarMoocStatus
} from '../controllers/marMoocController.js';

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const router = express.Router();

router.get('/', protect, getStudentMarMoocs);
router.post('/', protect, upload.single('file'), submitMarMooc);
router.get('/mentees', protect, getMenteeSubmissions);
router.put('/:id/status', protect, updateMarMoocStatus);

export default router;
