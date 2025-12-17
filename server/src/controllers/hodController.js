import Leave from '../models/Leave.js';
import User from '../models/User.js';

// @desc    Get HOD Dashboard Stats
// @route   GET /api/hod/dashboard
// @access  Private/HOD
const getHodDashboardStats = async (req, res) => {
    try {
        const { department } = req.user;

        if (!department) {
            return res.status(400).json({ message: 'User has no department assigned' });
        }

        const studentCount = await User.countDocuments({ role: 'student', department });
        const teacherCount = await User.countDocuments({ role: 'teacher', department });
        const pendingLeaves = await Leave.countDocuments({
            status: 'Pending HOD Approval'
        }).populate({
            path: 'student',
            match: { department }
        });
        // Note: populate doesn't filter the count directly in countDocuments with match this way effectively for basic filtering.
        // Better to find and filter or use aggregate.
        // Let's use aggregate for precise filtering by student department.

        const pendingLeavesCount = await Leave.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentData'
                }
            },
            { $unwind: '$studentData' },
            {
                $match: {
                    'studentData.department': department,
                    'status': 'Pending HOD Approval'
                }
            },
            { $count: 'count' }
        ]);

        const leavesCount = pendingLeavesCount.length > 0 ? pendingLeavesCount[0].count : 0;

        res.json({
            department,
            studentCount,
            teacherCount,
            pendingLeaves: leavesCount
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Pending Leaves (Department Scope)
// @route   GET /api/hod/leaves
// @access  Private/HOD
const getPendingLeaves = async (req, res) => {
    try {
        const { department } = req.user;

        // Fetch all leaves that are pending HOD approval
        // Filter by student department manually or via aggregation
        // Using populate + filter in JS for simplicity unless dataset is huge (Mock setup is small)

        const leaves = await Leave.find({ status: 'Pending HOD Approval' })
            .populate('student', 'name rollNumber department batch');

        // Filter for HOD's department
        const deptLeaves = leaves.filter(leave => leave.student && leave.student.department === department);

        res.json(deptLeaves);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve (Forward) or Reject Leave
// @route   PUT /api/hod/leaves/:id/action
// @access  Private/HOD
const handleLeaveAction = async (req, res) => {
    const { id } = req.params;
    const { action, remark } = req.body; // action: 'approve' | 'reject'

    try {
        const leave = await Leave.findById(id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave application not found' });
        }

        if (leave.status !== 'Pending HOD Approval') {
            return res.status(400).json({ message: `Leave is already ${leave.status}` });
        }

        leave.hodActionBy = req.user._id;
        leave.hodActionDate = Date.now();
        leave.hodRemark = remark || '';

        if (action === 'approve') {
            leave.status = 'Approved by HOD'; // Forwarded to Warden
        } else if (action === 'reject') {
            leave.status = 'Rejected by HOD';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        await leave.save();
        res.json({ message: `Leave ${action}ed successfully`, leave });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All Students of Department
// @route   GET /api/hod/students
// @access  Private/HOD
const getDepartmentStudents = async (req, res) => {
    try {
        const { department } = req.user;

        // Explicitly select only safe fields. 
        // derived 'year' or 'batch' is usually stored in 'batch' or 'year'. 
        // User schema has 'rollNumber', 'name', 'batch', 'email', 'section'.
        // STRICTLY EXCLUDE PASSWORD
        const students = await User.find({ role: 'student', department })
            .select('rollNumber name batch year email section _id')
            .sort({ rollNumber: 1 });

        // Add status: 'Active' (Mock logic as requested)
        const safeStudents = students.map(s => ({
            _id: s._id,
            rollNumber: s.rollNumber || 'N/A',
            name: s.name,
            batch: s.batch || s.year || 'N/A', // fallback
            email: s.email,
            status: 'Active' // Default per req
        }));

        res.json(safeStudents);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All Teachers of Department
// @route   GET /api/hod/teachers
// @access  Private/HOD
const getDepartmentTeachers = async (req, res) => {
    try {
        const { department } = req.user;

        // Fetch teachers
        // fields: Teacher ID (maybe employeeId or _id), Name, Subject/Expertise, Email, Designation
        const teachers = await User.find({ role: 'teacher', department })
            .select('employeeId name expertise specialization email designation _id')
            .sort({ name: 1 });

        const safeTeachers = teachers.map(t => ({
            _id: t._id,
            teacherId: t.employeeId || 'N/A',
            name: t.name,
            subjectExpertise: t.expertise && t.expertise.length > 0 ? t.expertise.join(', ') : (t.specialization || 'N/A'),
            email: t.email,
            designation: t.designation || 'Faculty'
        }));

        res.json(safeTeachers);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export {
    getHodDashboardStats,
    getPendingLeaves,
    handleLeaveAction,
    getDepartmentStudents,
    getDepartmentTeachers
};

