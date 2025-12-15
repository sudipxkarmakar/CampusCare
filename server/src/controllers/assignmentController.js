import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import fs from 'fs';

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Teacher/HOD
// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Teacher/HOD
export const createAssignment = async (req, res) => {
    const { type, title, description, link, subject, batch, section, deadline } = req.body; // Remove 'department' from destructuring

    try {
        // Validate Teacher
        // In prod, use req.user._id from middleware
        const teacher = await User.findById(req.user._id);

        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'hod')) {
            return res.status(403).json({ message: 'Not authorized to create assignments' });
        }

        let resourceLink = link || ''; // Default to provided link
        if (req.file) {
            // If file provided, override/set resourceLink
            resourceLink = `/uploads/assignments/${req.file.filename}`;
        }

        const assignment = await Assignment.create({
            type: type || 'assignment',
            title,
            description,
            link: resourceLink,
            subject,
            teacher: req.user._id,
            department: teacher.department, // Use Teacher's Department
            batch,
            section,
            deadline
        });

        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get assignments for a user (Student)
// @route   GET /api/assignments?dept=CSE&batch=2025&section=A
export const getAssignments = async (req, res) => {
    const { dept, batch, section } = req.query;

    try {
        let filter = {
            department: dept,
            batch: batch
        };

        // Logic: (dept == X AND batch == Y) AND (section == Z OR section does not exist)
        if (section) {
            filter.$or = [
                { section: section },
                { section: { $exists: false } },
                { section: null }
            ];
        }

        const assignments = await Assignment.find(filter)
            .populate('teacher', 'name')
            .sort({ deadline: 1 });

        // Check for submissions by THIS student
        let assignmentsWithStatus = [];
        if (req.user) {
            const submissions = await Submission.find({ student: req.user._id });
            const submissionMap = new Set(submissions.map(s => s.assignment.toString()));

            assignmentsWithStatus = assignments.map(a => {
                const doc = a.toObject();
                doc.submitted = submissionMap.has(a._id.toString());
                return doc;
            });
        } else {
            // Fallback if no user (should be protected usually)
            assignmentsWithStatus = assignments;
        }

        res.json(assignmentsWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const submitAssignment = async (req, res) => {
    const logParams = (msg) => {
        const logMsg = `[${new Date().toISOString()}] ${msg}\n`;
        try {
            // Using absolute path relative to CWD or __dirname might be safer
            // assuming process CWD is server root or project root?
            // Let's try appending to 'debug_submission.log' in CWD
            fs.appendFileSync('debug_submission.log', logMsg);
        } catch (e) { console.error('Log file error', e); }
    };

    try {
        logParams('Started submitAssignment');
        logParams(`Params ID: ${req.params.id}`);
        logParams(`User ID: ${req.user._id}`);
        logParams(`File: ${req.file ? req.file.filename : 'No File'}`);

        const assignmentId = req.params.id;
        const studentId = req.user._id;

        // Check if already submitted
        const existingSubmission = await Submission.findOne({
            assignment: assignmentId,
            student: studentId
        });

        if (existingSubmission) {
            logParams('Already submitted');
            return res.status(400).json({ message: 'Assignment already submitted' });
        }

        let submissionLink = '';
        if (req.file) {
            submissionLink = `/uploads/assignments/${req.file.filename}`;
        } else if (req.body.link) {
            submissionLink = req.body.link;
        } else {
            logParams('No file/link');
            return res.status(400).json({ message: 'Please upload a PDF file.' });
        }

        const submission = await Submission.create({
            assignment: assignmentId,
            student: studentId,
            link: submissionLink
        });

        logParams(`Submission Created: ${submission._id}`);
        res.status(201).json(submission);

    } catch (error) {
        if (typeof logParams === 'function') logParams(`Error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all assignments created by the logged-in teacher (Strict Dept)
// @route   GET /api/assignments/created
// @access  Teacher
export const getTeacherAssignments = async (req, res) => {
    try {
        const teacher = await User.findById(req.user._id);

        // Only show assignments where Teacher is creator AND Department matches (Strict View)
        const assignments = await Assignment.find({
            teacher: req.user._id,
            department: teacher.department
        })
            .sort({ createdAt: -1 }); // Newest first

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Teacher
export const getAssignmentSubmissions = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Verify that the requesting teacher is the owner
        if (assignment.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view these submissions' });
        }

        const submissions = await Submission.find({ assignment: req.params.id })
            .populate('student', 'name rollNumber email')
            .sort({ submittedAt: -1 });

        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Delete assignment/note
// @route   DELETE /api/assignments/:id
// @access  Teacher
export const deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        // Verify ownership
        if (assignment.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this resource' });
        }

        await assignment.deleteOne(); // or findByIdAndDelete

        res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
