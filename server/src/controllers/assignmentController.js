import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';

// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Teacher/HOD
export const createAssignment = async (req, res) => {
    const { title, description, subject, department, batch, section, deadline, teacherId } = req.body;

    try {
        // Validate Teacher
        // In prod, use req.user._id from middleware
        const teacher = await User.findById(teacherId);
        if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'hod')) {
            return res.status(403).json({ message: 'Not authorized to create assignments' });
        }

        const assignment = await Assignment.create({
            title,
            description,
            subject,
            teacher: teacherId,
            department,
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
