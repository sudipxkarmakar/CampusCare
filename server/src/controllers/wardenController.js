import Leave from '../models/Leave.js';
import Complaint from '../models/Complaint.js';
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

        const pendingLeaves = await Leave.countDocuments({ wardenStatus: 'Pending' });

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
        // Fetch leaves pending Warden approval (regardless of HOD status for new flow, or Approved by HOD for legacy)
        const leaves = await Leave.find({
            $or: [
                { wardenStatus: 'Pending' },
                { wardenStatus: { $exists: false }, status: 'Approved by HOD' }
            ]
        })
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
        if (leave.wardenStatus !== 'Pending') return res.status(400).json({ message: 'Leave is not pending Warden approval' });

        leave.wardenActionBy = req.user._id;
        leave.wardenActionDate = Date.now();
        leave.wardenRemark = remark || '';

        if (action === 'approve') {
            leave.wardenStatus = 'Approved';
            // Warden has final authority to issue pass regardless of HOD status
            leave.status = 'Approved';
        } else if (action === 'reject') {
            leave.wardenStatus = 'Rejected';
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

// @desc    Get All Hostelers
// @route   GET /api/warden/students
// @access  Private/Warden
const getHostelers = async (req, res) => {
    try {
        const hostelers = await User.find({ role: 'hosteler' })
            .select('name rollNumber department year hostelName roomNumber contactNumber email profilePicture')
            .sort({ name: 1 });
        res.json(hostelers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Mess Menu
// @route   GET /api/warden/mess
// @access  Private/Warden
const getMessMenu = async (req, res) => {
    try {
        const menu = await MessMenu.find({});
        res.json(menu);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get Hostel Complaints (Facility & Disciplinary)
// @route   GET /api/warden/complaints
// @access  Private/Warden
const getHostelComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({
            $or: [
                { category: { $in: ['Electrical', 'Sanitation', 'Civil', 'Mess', 'Other'] } }, // Facility
                { category: 'Disciplinary' } // Disciplinary
            ]
        })
            .populate('student', 'name roomNumber hostelName')
            .populate('againstUser', 'name')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching complaints' });
    }
};

// @desc    Resolve Complaint
// @route   PUT /api/warden/complaints/:id/resolve
// @access  Private/Warden
const resolveComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findById(id);

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        complaint.status = 'Resolved';
        complaint.resolvedBy = req.user._id;
        await complaint.save();

        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error resolving complaint' });
    }
};

// @desc    Escalate Complaint
// @route   PUT /api/warden/complaints/:id/escalate
// @access  Private/Warden
const escalateComplaint = async (req, res) => {
    const { target } = req.body; // 'Principal', 'Disciplinary Committee'
    try {
        const { id } = req.params;
        const complaint = await Complaint.findById(id);

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        complaint.status = 'In Progress';
        complaint.isUplifted = true;
        complaint.upliftedTo = target;
        await complaint.save();

        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error escalating complaint' });
    }
};

export {
    getWardenDashboardStats,
    getPendingLeaves,
    handleLeaveAction,
    updateMessMenu,
    getHostelers,
    getMessMenu,
    getHostelComplaints,
    resolveComplaint,
    escalateComplaint
};
