import User from '../models/User.js';
import Complaint from '../models/Complaint.js';

// @desc    Get logged in teacher's mentees (with optional filtering)
// @route   GET /api/teacher/my-mentees
// @access  Teacher
export const getMyMentees = async (req, res) => {
    const { search } = req.query; // Search by Roll Number or Name

    try {
        const teacher = await User.findById(req.user._id).populate('mentees', 'name email rollNumber department batch section mobile');

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher profile not found' });
        }

        let mentees = teacher.mentees;

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            mentees = mentees.filter(student =>
                (student.rollNumber && student.rollNumber.match(searchRegex)) ||
                (student.name && student.name.match(searchRegex))
            );
        }

        res.json(mentees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching mentees' });
    }
};

// @desc    Get issues/complaints reported by my mentees
// @route   GET /api/teacher/mentee-issues
// @access  Teacher
export const getMenteeIssues = async (req, res) => {
    try {
        const teacher = await User.findById(req.user._id);

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher profile not found' });
        }

        const menteeIds = teacher.mentees;

        const issues = await Complaint.find({ student: { $in: menteeIds } })
            .populate('student', 'name rollNumber')
            .sort({ createdAt: -1 });

        res.json(issues);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching mentee issues' });
    }
};

// @desc    Get All Students (Entire Database)
// @route   GET /api/teacher/all-students
// @access  Teacher
export const getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('-password')
            .sort({ rollNumber: 1 }); // Sort by Roll Number
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching students' });
    }
};
