import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Complaint from '../models/Complaint.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';

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
            .select('name email rollNumber department year batch subBatch section mobile contactNumber attendance attendanceTotal cgpa mar marTotal moocs moocsTotal assignmentsSubmitted assignmentsTotal profilePicture');

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
        const teacherId = req.user._id;
        const teacher = await User.findById(teacherId);

        // Fetch all assignments of this teacher once
        const teacherAssignments = await Assignment.find({
            teacher: teacherId,
            type: 'assignment'
        });

        // 1. Find all subjects where this user is a teacher
        // We check:
        // - 'teacher' field (Main teacher)
        // - 'teachers' array (Co-teachers)
        // - 'batchAssignments.teacher' (Specific batch teacher)
        const subjects = await Subject.find({
            $or: [
                { teacher: teacherId },
                { teachers: teacherId },
                { 'batchAssignments.teacher': teacherId }
            ]
        });

        // 2. Build Query for Students
        // We need to collect valid (passOutYear, batch) pairs
        let batchConditions = [];
        let seen = new Set();

        subjects.forEach(sub => {
            const passOutYear = sub.academicYear; // Assuming Subject model has academicYear e.g. "2026"

            // Determine batches for this teacher in this subject
            let myBatches = [];

            // A. Check specific batchAssignments
            if (sub.batchAssignments && sub.batchAssignments.length > 0) {
                const specificAssignments = sub.batchAssignments
                    .filter(ba => ba.teacher && ba.teacher.toString() === teacherId.toString())
                    .map(ba => ba.batch);

                if (specificAssignments.length > 0) {
                    myBatches = specificAssignments;
                }
            }

            // B. If no specific assignments found, AND I am a main teacher (teacher field or in teachers array)
            if (myBatches.length === 0) {
                const isMain = (sub.teacher && sub.teacher.toString() === teacherId.toString()) ||
                    (sub.teachers && sub.teachers.map(t => t.toString()).includes(teacherId.toString()));

                if (isMain) {
                    if (!sub.batchAssignments || sub.batchAssignments.length === 0) {
                        myBatches = [null]; // Indicator to only query by Year
                    }
                }
            }

            // Add conditions
            if (myBatches.length > 0) {
                myBatches.forEach(batch => {
                    const key = `${passOutYear}-${batch}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        if (batch === null) {
                            batchConditions.push({ passOutYear: passOutYear });
                        } else {
                            batchConditions.push({ passOutYear: passOutYear, batch: batch });
                        }
                    }
                });
            }
        });

        // Also add conditions from teacher's created assignments (dynamic fallback)
        teacherAssignments.forEach(a => {
            if (a.year && a.batch) {
                const key = `${a.year}-${a.batch}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    batchConditions.push({ year: a.year, batch: a.batch });
                }
            }
        });

        if (batchConditions.length === 0) {
            return res.json([]);
        }

        // 3. Find Students matching conditions
        // Using $or logic
        const query = {
            role: { $in: ['student', 'hosteler'] },
            $or: batchConditions
        };

        const students = await User.find(query)
            .select('-password')
            .sort({ rollNumber: 1 });

        // Dynamically compute actual assignments count and submitted count
        const enrichedStudents = await Promise.all(students.map(async (student) => {
            const normalizeBatch = (b) => {
                if (!b) return '';
                const digits = String(b).replace(/\D/g, '');
                return digits || String(b).toLowerCase().trim();
            };
            const normalizeStr = (s) => String(s || '').toLowerCase().trim();


            const studentDept = normalizeStr(student.department);
            const studentYear = normalizeStr(student.year);
            const studentBatch = normalizeBatch(student.batch);

            const matchedAssignments = teacherAssignments.filter(a => {
                return normalizeStr(a.department) === studentDept &&
                       normalizeStr(a.year) === studentYear &&
                       normalizeBatch(a.batch) === studentBatch;
            });

            const assignmentIds = matchedAssignments.map(a => a._id);
            const totalCount = matchedAssignments.length;

            let submittedCount = 0;
            if (totalCount > 0) {
                submittedCount = await Submission.countDocuments({
                    student: student._id,
                    assignment: { $in: assignmentIds }
                });
            }

            const studentObj = student.toObject();
            studentObj.assignmentsTotal = totalCount;
            studentObj.assignmentsSubmitted = submittedCount;
            return studentObj;
        }));

        res.json(enrichedStudents);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching students' });
    }
};
