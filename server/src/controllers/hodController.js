import Leave from '../models/Leave.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import mongoose from 'mongoose';

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

        const leaves = await Leave.find({
            status: { $in: ['Pending HOD Approval', 'Approved by HOD', 'Rejected by HOD'] }
        }).populate('student', 'name rollNumber department batch');

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
            expertise: t.expertise || [], // Send raw array
            specialization: t.specialization || '',
            email: t.email,
            designation: t.designation || 'Faculty'
        }));

        res.json(safeTeachers);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Get Department Complaints
// @route   GET /api/hod/complaints
// @access  Private/HOD
const getDepartmentComplaints = async (req, res) => {
    try {
        const { department } = req.user;

        // Find complaints where the student belongs to the department OR the complaint is against a user in the department
        // For simplicity, let's start with complaints FROM students of this department.

        // 1. Find all students of this department
        const students = await User.find({ role: 'student', department }).select('_id');
        const studentIds = students.map(s => s._id);

        const complaints = await Complaint.find({
            student: { $in: studentIds }
        })
            .populate('student', 'name rollNumber')
            .populate('againstUser', 'name designation')
            .sort({ createdAt: -1 });

        res.json(complaints);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getRoutine = async (req, res) => {
    try {
        const { department } = req.user;
        const { year, batch } = req.query;

        if (!year || !batch) {
            return res.status(400).json({ message: 'Year and Batch are required' });
        }

        const Routine = (await import('../models/Routine.js')).default;

        const routine = await Routine.find({ department, year, batch })
            .populate('teacher', 'name')
            .populate('subject', 'name code');

        res.json(routine);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Assign Mentor to Student
// @route   POST /api/hod/students/assign-mentor
// @access  Private/HOD
const assignMentor = async (req, res) => {
    try {
        const { studentId, teacherId } = req.body;

        const student = await User.findById(studentId);
        const teacher = await User.findById(teacherId);

        if (!student || !teacher) {
            return res.status(404).json({ message: 'Student or Teacher not found' });
        }

        // Update Student
        student.mentor = teacherId;
        await student.save();

        // Deprecated: We no longer store mentees list on Teacher model.
        // It is queried dynamically via student.mentor field.

        res.json({ message: 'Mentor assigned successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const assignSubjectTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { teacherId, batch } = req.body;

        const Subject = (await import('../models/Subject.js')).default;
        const User = (await import('../models/User.js')).default; // Use singleton import if possible, but this works

        const subject = await Subject.findById(id);
        const teacher = await User.findById(teacherId);

        if (!subject || !teacher) {
            return res.status(404).json({ message: 'Subject or Teacher not found' });
        }

        // --- EXPERTISE VALIDATION ---
        const subName = subject.name.toLowerCase();
        const expertise = (teacher.expertise || []).map(e => e.toLowerCase());
        const specialization = (teacher.specialization || '').toLowerCase();

        // Check if subject name is in expertise OR matches specialization
        const isExpert = expertise.some(e => subName.includes(e) || e.includes(subName)) ||
            (specialization && (subName.includes(specialization) || specialization.includes(subName)));

        // Allow if no expertise defined? No, strict as per request "assigned ... only"
        if (!isExpert && teacher.expertise && teacher.expertise.length > 0) {
            return res.status(400).json({
                message: `Teacher ${teacher.name} does not have expertise in ${subject.name}.`
            });
        }

        // --- SUBJECT UPDATE ---
        if (batch) {
            // Ensure batchAssignments exists
            if (!subject.batchAssignments) {
                subject.batchAssignments = [];
            }

            // Check if assignment exists for this batch
            const existingIndex = subject.batchAssignments.findIndex(ba => ba.batch === batch);

            if (existingIndex > -1) {
                // Update existing assignment
                subject.batchAssignments[existingIndex].teacher = teacherId;
            } else {
                // Add new assignment
                subject.batchAssignments.push({ batch, teacher: teacherId });
            }

            // Atomic update for persistence
            await Subject.findByIdAndUpdate(id, {
                $set: { batchAssignments: subject.batchAssignments },
                $addToSet: { teachers: new mongoose.Types.ObjectId(teacherId) }
            });

            // Refetch or update local for response
            if (!subject.teachers.includes(teacherId)) subject.teachers.push(teacherId);

        } else {
            // Legacy/Overall Assignment
            await Subject.findByIdAndUpdate(id, {
                $set: { teacher: teacherId },
                $addToSet: { teachers: new mongoose.Types.ObjectId(teacherId) }
            });
            subject.teacher = teacherId;
            if (!subject.teachers.includes(teacherId)) subject.teachers.push(teacherId);
        }

        const finalSubject = await Subject.findById(id).populate('batchAssignments.teacher', 'name');

        // --- USER UPDATE (Teaching Batches) ---
        // 1. Add Subject to teachingSubjects
        await User.findByIdAndUpdate(teacherId, {
            $addToSet: { teachingSubjects: subject.name }
        });

        // 2. Add Detailed Batch to teachingBatches if applicable
        if (batch) {
            const newBatchObj = {
                passOutYear: subject.academicYear || subject.year || 'N/A',
                batch: batch
            };

            // Manual duplicated check for object array
            const teacherForBatchUpdate = await User.findById(teacherId);

            // Ensure teachingBatches exists
            const currentBatches = teacherForBatchUpdate.teachingBatches || [];

            // Check if we already have this year+batch combo
            const alreadyExists = currentBatches.some(
                tb => tb.batch === newBatchObj.batch && tb.passOutYear === newBatchObj.passOutYear
            );

            if (!alreadyExists) {
                await User.findByIdAndUpdate(teacherId, {
                    $push: { teachingBatches: newBatchObj }
                });
            }
        }

        res.json({ message: 'Teacher assigned successfully', subject: finalSubject });

    } catch (error) {
        console.error('SERVER ERROR DETAILS:', JSON.stringify(error, null, 2));
        if (error.errors) console.error('VALIDATION ERRORS:', error.errors);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Unassign Teacher from Subject Batch
// @route   POST /api/hod/subjects/:id/unassign
// @access  Private/HOD
const unassignSubjectTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { batch } = req.body; // batch to unassign

        const Subject = (await import('../models/Subject.js')).default;

        const subject = await Subject.findById(id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        if (batch) {
            // Remove from batchAssignments
            // We use filter to remove the entry for this batch
            // Note: If multiple exists (erroneously), this removes all for that batch.
            const initialLength = subject.batchAssignments.length;
            subject.batchAssignments = subject.batchAssignments.filter(ba => ba.batch !== batch);

            if (subject.batchAssignments.length === initialLength) {
                return res.status(400).json({ message: 'No assignment found for this batch' });
            }

            // Atomic update
            await Subject.findByIdAndUpdate(id, {
                $set: { batchAssignments: subject.batchAssignments }
            });

            // Note: We are NOT removing from subject.teachers (historical record/main list) 
            // nor cleaning up User.teachingBatches efficiently yet to avoid race conditions 
            // with other subjects. This can be a future cron job or more complex logic.
        } else {
            return res.status(400).json({ message: 'Batch is required for unassignment' });
        }

        const finalSubject = await Subject.findById(id).populate('batchAssignments.teacher', 'name');
        res.json({ message: 'Teacher unassigned successfully', subject: finalSubject });

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
    getDepartmentTeachers,
    getDepartmentComplaints,
    getRoutine,
    assignMentor,
    assignSubjectTeacher,
    unassignSubjectTeacher // Export new function
};
