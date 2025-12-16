import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Leave from '../models/Leave.js';
import Notice from '../models/Notice.js';

// @desc    Get Hostel Statistics
// @route   GET /api/dean/stats
// @access  Dean/Admin
export const getHostelStats = async (req, res) => {
    try {
        const totalHostelers = await User.countDocuments({ role: 'hosteler' });

        // Count by Hostel Name if field effectively used
        // Assuming 'hostelName' is populated.
        const hostelWise = await User.aggregate([
            { $match: { role: 'hosteler' } },
            { $group: { _id: "$hostelName", count: { $sum: 1 } } }
        ]);

        const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });
        const openComplaints = await Complaint.countDocuments({ category: 'Hostel', status: { $ne: 'Resolved' } });

        res.json({
            totalHostelers,
            hostelWise,
            pendingLeaves,
            openComplaints
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error stats' });
    }
};

// @desc    Get Hostel Complaints
// @route   GET /api/dean/complaints
// @access  Dean/Admin
export const getHostelComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ category: { $in: ['Hostel', 'Mess', 'Plumbing', 'Electrical'] } })
            .populate('student', 'name rollNumber hostelName roomNumber')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error complaints' });
    }
};

// @desc    Get Hostel Leaves
// @route   GET /api/dean/leaves
// @access  Dean/Admin
export const getHostelLeaves = async (req, res) => {
    try {
        // Fetch Pending by default or all? Let's return all but sorted
        const leaves = await Leave.find({})
            .populate('student', 'name rollNumber hostelName roomNumber')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error leaves' });
    }
};

// @desc    Approve/Reject Leave
// @route   PUT /api/dean/leave/:id
// @access  Dean/Admin
export const manageHostelLeave = async (req, res) => {
    try {
        const { status, remark } = req.body; // status: Approved / Rejected
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        leave.status = status;
        leave.wardenRemark = remark;
        await leave.save();

        res.json(leave);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error manage leave' });
    }
};
