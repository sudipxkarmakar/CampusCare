import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Leave from '../models/Leave.js';

// @desc    Get Principal Dashboard Stats
// @route   GET /api/principal/dashboard
// @access  Private/Principal
const getPrincipalDashboardStats = async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student' });
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        const hodCount = await User.countDocuments({ role: 'hod' });
        const wardenCount = await User.countDocuments({ role: 'warden' });

        const openComplaints = await Complaint.countDocuments({ status: { $ne: 'Resolved' } });
        const leavesToday = await Leave.countDocuments({
            // Mocking 'Today' logic roughly or just total active leaves
            status: { $in: ['Approved by HOD', 'Approved by Warden'] }
        });

        res.json({
            studentCount,
            teacherCount,
            hodCount,
            wardenCount,
            openComplaints,
            activeLeaves: leavesToday
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All Staff
// @route   GET /api/principal/staff
// @access  Private/Principal
const getAllStaff = async (req, res) => {
    try {
        const staff = await User.find({
            role: { $in: ['teacher', 'hod', 'warden', 'librarian'] }
        }).select('-password');
        res.json(staff);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Resolve Complaint Directly
// @route   PUT /api/principal/complaints/:id/resolve
// @access  Private/Principal
const resolveComplaintDirectly = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findById(id);

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        complaint.status = 'Resolved';
        complaint.resolvedBy = req.user._id;
        complaint.resolutionRemark = 'Resolved directly by Principal';

        await complaint.save();
        res.json(complaint);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All Students
// @route   GET /api/principal/students
// @access  Private/Principal
// @desc    Get All Students
// @route   GET /api/principal/students
// @access  Private/Principal
const getAllStudents = async (req, res) => {
    try {
        // Optimized: Select only fields needed for the table
        const students = await User.find({ role: 'student' })
            .select('name rollNumber department batch email')
            .lean(); // Faster execution
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All Teachers
// @route   GET /api/principal/teachers
// @access  Private/Principal
const getAllTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' })
            .select('name employeeId department email')
            .lean();
        res.json(teachers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All HODs
// @route   GET /api/principal/hods
// @access  Private/Principal
const getAllHODs = async (req, res) => {
    try {
        const hods = await User.find({ role: 'hod' })
            .select('name employeeId department email')
            .lean();
        res.json(hods);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All Wardens
// @route   GET /api/principal/wardens
// @access  Private/Principal
const getAllWardens = async (req, res) => {
    try {
        const wardens = await User.find({ role: 'warden' })
            .select('name employeeId hostelName email')
            .lean();
        res.json(wardens);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export {
    getPrincipalDashboardStats,
    getAllStaff,
    resolveComplaintDirectly,
    getAllStudents,
    getAllTeachers,
    getAllHODs,
    getAllWardens
};
