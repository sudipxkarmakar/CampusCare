import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

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
        const query = {
            department: dept,
            batch: batch,
        };

        // If section provided, filter match. If assignment has no section, it's for whole batch?
        // Let's assume if assignment.section is null, it applies to all. 
        // Or strictly match query.

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

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
