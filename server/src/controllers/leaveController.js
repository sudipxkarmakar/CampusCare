import Leave from '../models/Leave.js';
import User from '../models/User.js';

// @desc    Get leaves from mentees
// @route   GET /api/leaves/mentees
export const getMenteeLeaves = async (req, res) => {
    if (global.MOCK_MODE) {
        return res.json([
            {
                _id: 'mock_l1',
                type: 'Medical',
                startDate: new Date(),
                endDate: new Date(Date.now() + 86400000),
                reason: 'Fever',
                status: 'Pending',
                student: { name: 'Mock Mentee', roomNumber: '101' }
            }
        ]);
    }
    try {
        console.log('[DEBUG] getMenteeLeaves called. User ID:', req.user?._id);
        const teacher = await User.findById(req.user._id);
        console.log('[DEBUG] Teacher found:', teacher ? 'Yes' : 'No');

        if (!teacher || !teacher.mentees || teacher.mentees.length === 0) {
            console.log('[DEBUG] No mentees found.');
            return res.json([]);
        }

        const leaves = await Leave.find({
            student: { $in: teacher.mentees }
        })
            .populate('student', 'name rollNumber roomNumber hostelName')
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update leave status
// @route   PUT /api/leaves/:id/status
export const updateLeaveStatus = async (req, res) => {
    const { status, wardenRemark } = req.body;

    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        leave.status = status;
        if (wardenRemark) leave.wardenRemark = wardenRemark;

        await leave.save();

        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
