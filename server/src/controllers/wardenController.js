import Leave from '../models/Leave.js';
import MessMenu from '../models/MessMenu.js';
import User from '../models/User.js';

// @desc    Get Warden Dashboard Stats
// @route   GET /api/warden/dashboard
// @access  Private/Warden
const getWardenDashboardStats = async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student', hosteler: true }); // Assuming hosteler flag or role='hosteler' or role='student'&hostelName exists
        // Based on User.js: role can be 'hosteler', or student with hostelName.
        // Let's use role='hosteler' or hostelName populated.
        // User schema has `role` enum including 'hosteler' BUT also `hostelName`.
        // Let's assume role 'hosteler' represents active hostel residents.

        const hostelerCount = await User.countDocuments({ role: 'hosteler' });

        const pendingLeaves = await Leave.countDocuments({ status: 'Approved by HOD' });

        res.json({
            hostelerCount,
            pendingLeaves
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Pending Leaves (Final Approval)
// @route   GET /api/warden/leaves
// @access  Private/Warden
const getPendingLeaves = async (req, res) => {
    try {
        // Fetch leaves forwarded by HOD
        const leaves = await Leave.find({ status: 'Approved by HOD' })
            .populate('student', 'name rollNumber roomNumber hostelName batch department')
            .populate('hodActionBy', 'name'); // Showing who forwarded it

        res.json(leaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Final Approve or Reject Leave
// @route   PUT /api/warden/leaves/:id/action
// @access  Private/Warden
const handleLeaveAction = async (req, res) => {
    const { id } = req.params;
    const { action, remark } = req.body; // action: 'approve' | 'reject'

    try {
        const leave = await Leave.findById(id);

        if (!leave) return res.status(404).json({ message: 'Leave not found' });
        if (leave.status !== 'Approved by HOD') return res.status(400).json({ message: 'Leave not pending Warden approval' });

        leave.wardenActionBy = req.user._id;
        leave.wardenActionDate = Date.now();
        leave.wardenRemark = remark || '';

        if (action === 'approve') {
            leave.status = 'Approved by Warden';
        } else if (action === 'reject') {
            leave.status = 'Rejected by Warden';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        await leave.save();
        res.json(leave);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Mess Menu
// @route   PUT /api/warden/mess
// @access  Private/Warden
const updateMessMenu = async (req, res) => {
    try {
        const { day, breakfast, lunch, snacks, dinner } = req.body;
        // Upsert
        const menu = await MessMenu.findOneAndUpdate(
            { day },
            { breakfast, lunch, snacks, dinner },
            { new: true, upsert: true }
        );
        res.json(menu);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export {
    getWardenDashboardStats,
    getPendingLeaves,
    handleLeaveAction,
    updateMessMenu
};
