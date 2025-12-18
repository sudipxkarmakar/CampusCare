import User from '../models/User.js';
import Complaint from '../models/Complaint.js';

// @desc    Get logged in teacher's mentees (with optional filtering)
// @route   GET /api/teacher/my-mentees
// @access  Teacher
// @desc    Get logged in teacher's mentees (Enriched View)
// @route   GET /api/teacher/my-mentees
// @access  Teacher
export const getMyMentees = async (req, res) => {
    try {
        // 1. Find all students where mentor equals this teacher
        let mentees = await User.find({ mentor: req.user._id })
            .select('name email rollNumber department batch subBatch section mobile attendance cgpa mar moocs');

        // Optional Search Filter
        const { search } = req.query;
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            mentees = mentees.filter(student =>
                (student.rollNumber && student.rollNumber.match(searchRegex)) ||
                (student.name && student.name.match(searchRegex))
            );
        }

        // 2. Aggregate Extra Data (Complaints, Leaves)
        // Ideally use $lookup aggregate, but efficient enough for <50 students loop
        const enrichedMentees = await Promise.all(mentees.map(async (student) => {
            const complaintCount = await Complaint.countDocuments({ student: student._id, status: { $ne: 'Resolved' } });
            const leaveCount = 0; // Placeholder until Leave model is fully integrated or checked
            // const leaveCount = await Leave.countDocuments({ student: student._id, status: 'Pending' });

            return {
                ...student.toObject(),
                activeComplaints: complaintCount,
                pendingLeaves: leaveCount,
                status: (parseFloat(student.attendance) < 75) ? 'Critical' : 'Good'
            };
        }));

        res.json(enrichedMentees);
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
        // Find students who have this teacher as mentor
        const mentees = await User.find({ mentor: req.user._id }).select('_id');
        const menteeIds = mentees.map(m => m._id);

        const issues = await Complaint.find({ student: { $in: menteeIds } })
            .populate('student', 'name rollNumber')
            .sort({ createdAt: -1 });

        res.json(issues);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching mentee issues' });
    }
};

// @desc    Get All Students (Filtered by Teacher's Department & Batches)
// @route   GET /api/teacher/all-students
// @access  Teacher
export const getAllStudents = async (req, res) => {
    // --- MOCK MODE ---
    if (global.MOCK_MODE) {
        return res.json([
            { _id: 'm1', name: 'Mock Student 1', rollNumber: 'CSE-101', department: 'CSE', mobile: '9998887771' },
            { _id: 'm2', name: 'Mock Student 2', rollNumber: 'CSE-102', department: 'CSE', mobile: '9998887772' },
            { _id: 'm3', name: 'Mock Student 3', rollNumber: 'CSE-103', department: 'CSE', mobile: '9998887773' },
        ]);
    }

    try {
        // Ensure strictly limiting to teacher's department AND teaching batches
        const teacher = await User.findById(req.user._id);
        const teacherDept = teacher.department;
        const teachingBatches = teacher.teachingBatches || [];
        // teachingBatches is now [{ year: "2026", batch: "Batch 1" }, ...]

        const query = {
            role: 'student',
            department: teacherDept
        };

        // If teacher has assigned batches, filter by them.
        if (teachingBatches.length > 0) {
            // Construct $or query for (year A AND batch B) OR (year X AND batch Y)

            const batchConditions = teachingBatches.map(tb => ({
                passOutYear: tb.passOutYear,
                batch: tb.batch
            }));

            // Filter students who match ANY of the teaching batches
            query.$or = batchConditions;
        } else {
            // If no batches assigned, return empty to be safe/strict as per request
            return res.json([]);
        }

        const students = await User.find(query)
            .select('-password')
            .sort({ rollNumber: 1 });

        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching students' });
    }
};
