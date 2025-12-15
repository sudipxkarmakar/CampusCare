import { createAssignment, getAssignments, submitAssignment, getTeacherAssignments, getAssignmentSubmissions, deleteAssignment } from '../controllers/assignmentController.js';

// ... (middleware imports)

// ... (multer config)

const router = express.Router();

// ... (routes)

router.post('/', protect, upload.single('file'), createAssignment);
router.get('/', protect, getAssignments);
router.get('/created', protect, getTeacherAssignments);
router.get('/:id/submissions', protect, getAssignmentSubmissions);
router.post('/:id/submit', protect, (req, res, next) => {
    console.log(`[ROUTE] POST /:id/submit hit for ID: ${req.params.id}`);
    next();
}, upload.single('file'), submitAssignment);
router.delete('/:id', protect, deleteAssignment);

export default router;
