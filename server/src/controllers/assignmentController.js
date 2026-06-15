import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';


// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Teacher/HOD
// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Teacher/HOD
export const createAssignment = async (req, res) => {
    const { type, title, description, link, subject, department, batch, section, deadline, year } = req.body;

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
            department: department || teacher.department, // Use submitted Department, fallback to Teacher's Department
            year,
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
        let filter = {};

        // Strict Filtering for Students
        if (req.user && req.user.role === 'student') {
            filter.department = req.user.department;
            filter.year = req.user.year;
            // Allow batch specific OR 'All'
            filter.batch = { $in: [req.user.batch, 'All'] };

            // Section filtering can be strict or optional depending on logic.
            // If assignments are section-specific:
            if (req.user.section) {
                filter.$or = [
                    { section: req.user.section },
                    { section: { $exists: false } },
                    { section: null }
                ];
            }
        } else {
            // Teacher/Admin or Public View (if allowed)
            if (dept) filter.department = dept;
            if (batch) filter.batch = batch;

            if (section) {
                filter.$or = [
                    { section: section },
                    { section: { $exists: false } },
                    { section: null }
                ];
            }
        }

        const assignments = await Assignment.find(filter)
            .populate('teacher', 'name')
            .sort({ createdAt: -1 });

        // Check for submissions by THIS student
        let assignmentsWithStatus = [];
        if (req.user && req.user.role === 'student') {
            const submissions = await Submission.find({ student: req.user._id });
            const submissionMap = new Map(submissions.map(s => [s.assignment.toString(), s]));

            assignmentsWithStatus = assignments.map(a => {
                const doc = a.toObject();
                const sub = submissionMap.get(a._id.toString());
                doc.submitted = !!sub;
                doc.submission = sub || null;
                return doc;
            });
        } else {
            assignmentsWithStatus = assignments;
        }

        res.json(assignmentsWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const submitAssignment = async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const studentId = req.user._id;

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check if already submitted
        const existingSubmission = await Submission.findOne({
            assignment: assignmentId,
            student: studentId
        });

        let submissionLink = '';
        if (req.file) {
            submissionLink = `/uploads/assignments/${req.file.filename}`;
        } else if (req.body.link) {
            submissionLink = req.body.link;
        } else {
            return res.status(400).json({ message: 'Please upload a file.' });
        }

        if (existingSubmission) {
            // Check if deadline has passed
            if (assignment.deadline && new Date() > new Date(assignment.deadline)) {
                return res.status(400).json({ message: 'Deadline has passed. Resubmission is not permitted.' });
            }
            existingSubmission.link = submissionLink;
            existingSubmission.submittedAt = Date.now();
            existingSubmission.status = 'Pending';
            existingSubmission.grade = undefined;
            existingSubmission.feedback = undefined;
            await existingSubmission.save();
            return res.status(200).json(existingSubmission);
        }

        const submission = await Submission.create({
            assignment: assignmentId,
            student: studentId,
            link: submissionLink
        });

        res.status(201).json(submission);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all assignments created by the logged-in teacher (Strict Dept) with Submission Count
// @route   GET /api/assignments/created
// @access  Teacher
export const getTeacherAssignments = async (req, res) => {
    try {
        // Only show assignments where Teacher is creator
        const assignments = await Assignment.find({
            teacher: req.user._id
        })
            .sort({ createdAt: -1 })
            .lean(); // Convert to POJO to attach property

        // Append submission counts
        const assignmentsWithCount = await Promise.all(assignments.map(async (assign) => {
            const count = await Submission.countDocuments({ assignment: assign._id });
            return { ...assign, submissionCount: count };
        }));

        res.json(assignmentsWithCount);
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

// @desc    Update submission status (Approve/Reject)
// @route   PATCH /api/assignments/:id/submissions/:subId/status
// @access  Teacher
export const updateSubmissionStatus = async (req, res) => {
    try {
        const { id, subId } = req.params;
        const { status, grade, feedback } = req.body; // Allow grade and feedback

        if (status && !['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Use Approved, Rejected, or Pending.' });
        }

        const assignment = await Assignment.findById(id);
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

        if (assignment.teacher.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify this assignment' });
        }

        const submission = await Submission.findById(subId);
        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        if (status) submission.status = status;
        if (grade !== undefined) submission.grade = grade;
        if (feedback !== undefined) submission.feedback = feedback;
        
        await submission.save();

        res.json({ message: `Submission updated successfully`, submission });
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

// @desc    Get unique assignment metadata (subjects, departments, batches) for dropdown population
// @route   GET /api/assignments/metadata
// @access  Teacher
export const getAssignmentMetadata = async (req, res) => {
    try {
        const subjects = await Assignment.distinct('subject');
        const departments = await Assignment.distinct('department');
        const batches = await Assignment.distinct('batch');
        res.json({ subjects, departments, batches });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
