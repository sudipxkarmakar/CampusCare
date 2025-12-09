import User from '../models/User.js';

// @desc    Assign a Mentor to a Student
// @route   POST /api/admin/assign-mentor
// @access  Admin Only (or HOD)
export const assignMentor = async (req, res) => {
    const { studentId, teacherId } = req.body;

    try {
        const student = await User.findById(studentId);
        const teacher = await User.findById(teacherId);

        if (!student || !teacher) {
            return res.status(404).json({ message: 'Student or Teacher not found' });
        }

        if (teacher.role !== 'teacher' && teacher.role !== 'hod') {
            return res.status(400).json({ message: 'Selected user is not a teacher' });
        }

        // Assign Reference
        student.mentor = teacherId;
        await student.save();

        // Add to Teacher's Mentees list if not already there
        if (!teacher.mentees.includes(studentId)) {
            teacher.mentees.push(studentId);
            await teacher.save();
        }

        res.json({ message: `Assigned ${student.name} to Mentor ${teacher.name}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Promote Teacher to HOD
// @route   POST /api/admin/promote-hod
// @access  Admin Only
export const promoteToHOD = async (req, res) => {
    const { teacherId, department } = req.body;

    try {
        const teacher = await User.findById(teacherId);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        teacher.role = 'hod';
        teacher.department = department; // Ensure dept matches
        await teacher.save();

        res.json({ message: `${teacher.name} is now HOD of ${department}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users in a department
// @route   GET /api/admin/dept/:dept
export const getDeptUsers = async (req, res) => {
    const { dept } = req.params;
    try {
        const users = await User.find({ department: dept }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
