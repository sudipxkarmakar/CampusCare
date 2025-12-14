import User from '../models/User.js';

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
