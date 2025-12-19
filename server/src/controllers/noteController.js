import Note from '../models/Note.js';
import User from '../models/User.js';

// @desc    Create a new note
// @route   POST /api/notes
// @access  Teacher
export const createNote = async (req, res) => {
    // Note model uses: subject, topic, description, uploadedBy, fileUrl, department, year, batch, subBatch, semester
    const { title, subject, batch, description, year, department } = req.body;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File is required' });
        }

        const fileUrl = `/uploads/notes/${req.file.filename}`;

        const note = await Note.create({
            topic: title, // Frontend sends title, model uses topic
            subject,
            description,
            uploadedBy: req.user._id, // Auth middleware required
            fileUrl,
            department: department || req.user.department,
            year,
            batch,
            // semester: null // Derived or optional
        });

        res.status(201).json(note);
    } catch (error) {
        console.error("Create Note Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get notes for students (Public/Protected)
// @route   GET /api/notes
export const getNotes = async (req, res) => {
    const { dept, batch, year, subject } = req.query;

    try {
        let filter = {};

        // If student, strict filtering could be applied here similar to assignments
        if (req.user && req.user.role === 'student') {
            filter.department = req.user.department;
            filter.year = req.user.year; // e.g. "4th Year"
            // Allow batch specific OR 'All' implied? Note model doesn't explicitly store 'All' yet usually
            // If note is for Batch 1, only batch 1 sees it. 
            // If teacher wants to share with all, they might select multiple batches or we need 'All' logic.
            // For now, simple match.
            filter.batch = req.user.batch;
        } else {
            // Teacher/Admin filters
            if (dept) filter.department = dept;
            if (batch) filter.batch = batch;
            if (year) filter.year = year;
            if (subject) filter.subject = subject;
        }

        const notes = await Note.find(filter)
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get notes created by logged in teacher
// @route   GET /api/notes/created
// @access  Teacher
export const getTeacherNotes = async (req, res) => {
    try {
        const notes = await Note.find({ uploadedBy: req.user._id })
            .sort({ createdAt: -1 });

        // Return with 'type: note' for frontend consistency if needed, 
        // though frontend can adapt.
        const notesWithFlag = notes.map(n => ({ ...n.toObject(), type: 'note' }));

        res.json(notesWithFlag);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Teacher
export const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (note.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this note' });
        }

        await note.deleteOne();
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
