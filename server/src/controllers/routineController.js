import Routine from '../models/Routine.js';
import User from '../models/User.js';

// @desc    Get Student Routine (My Class)
// @route   GET /api/routine/student
// @access  Private
export const getStudentRoutine = async (req, res) => {
    try {
        // Assume user is attached to req by middleware (or passed as query for testing)
        // For simulation, we'll take query params or body, but typically req.user

        let { department, year, batch, subBatch } = req.query;

        // If 'me' (authenticated user context)
        if (req.user && req.user.role === 'student') {
            department = req.user.department;
            year = req.user.year; // "2nd Year"
            batch = req.user.batch; // "1"
            subBatch = req.user.subBatch; // "1-1"
        }

        const query = {
            department,
            year,
            batch
        };

        // Sub-batch logic: verify if routine is specific to sub-batch or general to batch
        // If query has subBatch, match (subBatch OR null)
        if (subBatch) {
            query.$or = [
                { subBatch: subBatch },
                { subBatch: null },
                { subBatch: { $exists: false } }
            ];
        }

        const routine = await Routine.find(query)
            .populate('subject', 'name code')
            .populate('teacher', 'name')
            .sort({ day: 1, period: 1 }); // Sort by day then time

        res.json(routine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Teacher Routine (My Schedule)
// @route   GET /api/routine/teacher
// @access  Private
export const getTeacherRoutine = async (req, res) => {
    try {
        let teacherId = req.query.teacherId;

        // If authenticated
        if (req.user && req.user.role === 'teacher') {
            teacherId = req.user._id;
        }

        const routine = await Routine.find({ teacher: teacherId })
            .populate('subject', 'name code')
            .sort({ day: 1, period: 1 });

        res.json(routine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Routine Entry (HOD)
// @route   POST /api/routine
// @access  HOD
export const createRoutine = async (req, res) => {
    try {
        const entry = await Routine.create(req.body);
        res.status(201).json(entry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
