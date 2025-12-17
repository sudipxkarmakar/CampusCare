import Assignment from '../models/Assignment.js';
import Note from '../models/Note.js';
import Notice from '../models/Notice.js';

// @desc    Create Assignment (with Smart Targeting)
// @route   POST /api/content/assignment
// @access  Teacher
export const createAssignment = async (req, res) => {
    try {
        const { title, description, subject, department, year, batch, subBatch, deadline, link } = req.body;

        const assignment = await Assignment.create({
            title,
            description,
            subject,
            teacher: req.user._id,
            department, // e.g. CSE
            year,       // e.g. 2nd Year
            batch,      // e.g. 1
            subBatch,   // e.g. 1-1 (Optional)
            deadline,
            link
        });

        res.status(201).json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error creating assignment' });
    }
};

// @desc    Create Note (with Smart Targeting)
// @route   POST /api/content/note
// @access  Teacher
export const createNote = async (req, res) => {
    try {
        const { subject, topic, description, department, year, batch, subBatch } = req.body;

        let fileUrl = '';
        if (req.file) {
            // Construct the file URL (assuming static serve enabled for 'docs')
            // The file is saved in 'docs/uploads/assignments'
            // We need to store a relative path accessible from the browser
            // Since Multer saves to .../docs/uploads/assignments',
            // And if we serve 'docs' statically, the path should be '/uploads/assignments/filename'
            fileUrl = `/uploads/assignments/${req.file.filename}`;
        }

        const note = await Note.create({
            subject,
            topic,
            description,
            uploadedBy: req.user._id,
            fileUrl,
            department,
            year,
            batch,
            subBatch
        });

        res.status(201).json(note);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error creating note' });
    }
};

// @desc    Create Notice (with Smart Targeting)
// @route   POST /api/content/notice
// @access  Teacher/Admin
export const createNotice = async (req, res) => {
    try {
        const { title, content, audience, targetDept, targetYear, targetBatch, targetSubBatch } = req.body;

        const notice = await Notice.create({
            title,
            content,
            postedBy: req.user._id,
            audience, // 'general' or 'student'
            targetDept,
            targetYear,
            targetBatch,
            targetSubBatch
        });

        res.status(201).json(notice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error creating notice' });
    }
};

// @desc    Get Content for Student (Smart Filtered)
// @route   GET /api/content/my-content
// @access  Student
export const getMyContent = async (req, res) => {
    try {
        const { department, year, batch, subBatch, section } = req.user;

        // Fetch Assignments
        // Logic: 
        // 1. Matches Dept AND Year
        // 2. Matches Batch (OR Batch is not set/all)
        // 3. Matches SubBatch (OR SubBatch is not set/all)
        // 4. Matches Section (If user has one, and Assignment has one)

        let assignmentQuery = {
            department: department,
            year: year,
            $or: [
                { batch: batch, subBatch: { $exists: false } }, // Batch level
                { batch: batch, subBatch: null }, // Batch level
                { batch: batch, subBatch: subBatch } // Specific Sub-batch
            ]
        };

        // Section Filtering (Assignments only)
        if (section) {
            assignmentQuery.$and = [
                {
                    $or: [
                        { section: section },
                        { section: { $exists: false } },
                        { section: null }
                    ]
                }
            ];
        }

        const assignments = await Assignment.find(assignmentQuery)
            .sort({ createdAt: -1 })
            .populate('teacher', 'name email');

        const notes = await Note.find({
            department: department,
            year: year,
            $or: [
                { batch: batch, subBatch: { $exists: false } },
                { batch: batch, subBatch: null },
                { batch: batch, subBatch: subBatch }
            ]
        }).sort({ createdAt: -1 })
            .populate('uploadedBy', 'name email');

        // Notices: General OR (Dept matches, and optional granular matches)
        const notices = await Notice.find({
            $or: [
                { audience: 'general' },
                { audience: 'student', targetDept: { $exists: false } }, // All students
                {
                    audience: 'student',
                    targetDept: department,
                    // If targetYear is set, must match. If not, matches all years. 
                    // This creates complex query logic.
                    // Let's assume posted notices always set targetDept if targeting specific group.
                    $or: [
                        { targetYear: { $exists: false } },
                        { targetYear: year, targetBatch: { $exists: false } },
                        { targetYear: year, targetBatch: batch, targetSubBatch: { $exists: false } },
                        { targetYear: year, targetBatch: batch, targetSubBatch: subBatch }
                    ]
                }
            ]
        }).sort({ date: -1 });

        res.json({ assignments, notes, notices });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching content' });
    }
};

// @desc    Get all notes created by the logged-in teacher
// @route   GET /api/content/note/created
// @access  Teacher
export const getTeacherNotes = async (req, res) => {
    try {
        const notes = await Note.find({ uploadedBy: req.user._id })
            .sort({ createdAt: -1 });

        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching notes' });
    }

};

// @desc    Delete Note
// @route   DELETE /api/content/note/:id
// @access  Teacher
export const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Check user
        if (note.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // Optional: Delete file from filesystem if needed (using fs.unlink)
        // For now, just delete the DB record.

        await note.deleteOne();

        res.json({ message: 'Note removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error deleting note' });
    }
};
