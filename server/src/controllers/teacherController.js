import User from '../models/User.js';
import Subject from '../models/Subject.js';
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
            .select('name email rollNumber department year batch subBatch section mobile contactNumber attendance cgpa mar moocs profilePicture');

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

        // 1. Find all subjects where this user is a teacher
        // We check:
        // - 'teacher' field (Main teacher)
        // - 'teachers' array (Co-teachers)
        // - 'batchAssignments.teacher' (Specific batch teacher)

        // Import Subject to be sure (it should be imported at top level if not already)
        // Check imports in file... assuming Subject imported or will add import if missing.
        // Wait, I need to check imports. If Subject not imported, this will fail.
        // I will add the import in a separate tool call if needed or include it here if I could.
        // But I can't see the top of the file in this tool call's context easily without viewing again.
        // I'll assume I need to add the import. Ideally I'd use multi_replace for that.
        // For now, let's write the function logic.

        // Since I'm replacing the whole function, I can try to include the import at the top if I use multi-replace or just ensure it's there.
        // Let's use `Subject` assuming it's imported. I'll verify imports in a sec.

        // Correction: I should probably use multi_replace to add the import AND update the function.
        // User query: Fetch students based on assignments.

        // Query Subjects
        /* 
           logic:
           Find subjects where:
             teacher == me OR teachers contains me OR batchAssignments.teacher == me
        */

        // Note: reusing the import logic from previous View (it was not imported in teacherController previously).
        // So I MUST add the import.

        // Logic continued:
        // For each subject, collect valid (passOutYear, batch) tuples.
        // - If I am in batchAssignments, use those specific batches.
        // - If I am main teacher and NO batchAssignments for me, do I get all batches?
        //   Use "academicYear" (e.g. 2026) from Subject.
        // We check: 'teacher' (Main), 'teachers' (Array), and 'batchAssignments.teacher' (Specific)
        const subjects = await Subject.find({
            $or: [
                { teacher: teacherId },
                { teachers: teacherId },
                { 'batchAssignments.teacher': teacherId }
            ]
        });

        if (subjects.length === 0) {
            return res.json([]);
        }

        // 2. Build Query for Students
        // We need to collect valid (passOutYear, batch) pairs
        // NOTE: Subject model uses 'academicYear' (e.g. 2026) -> maps to student's 'passOutYear' ?
        // Or 'year' (e.g. "4th Year") -> maps to student's 'year' ?
        // User request mentions: "2026 batch1 and 2029 batch 1 & 2"
        // This implies we should use `passOutYear` (which seems to be 'academicYear' in Subject) and `batch`.

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
            // we might assume I teach ALL batches for this subject?
            // User's previous constraint was strict: "Prof IT 1 teaches cyber security to 4th year batch 1... not batch 2".
            // If the DB only has batch assignments, we strictly follow them.
            // If `myBatches` is still empty here, it means I am listed as a teacher but NOT in any batchAssignment.
            // This might mean I am a generic teacher (maybe coordinator?). 
            // SAFETY: If I am in `batchAssignments` for ANY batch, I only get those. 
            // If I am NOT in `batchAssignments` at all, but I am in `teachers`, fallback to ALL batches?
            // Let's assume strictness. If I am not in batchAssignments, I get NO students for this subject?
            // Wait, if legacy data has no batchAssignments, we should probably allow all.

            if (myBatches.length === 0) {
                // Check if I am main teacher
                const isMain = (sub.teacher && sub.teacher.toString() === teacherId.toString()) ||
                    (sub.teachers && sub.teachers.map(t => t.toString()).includes(teacherId.toString()));

                if (isMain) {
                    // If no batchAssignments defined on subject at all, assume all.
                    if (!sub.batchAssignments || sub.batchAssignments.length === 0) {
                        // All likely batches? how do we know?
                        // We can't filter by batch then, just filter by passOutYear.
                        myBatches = [null]; // Indicator to only query by Year
                    }
                    // If batchAssignments exist but I'm not in them, and I'm main... maybe I supervise?
                    // Let's err on side of caution: if batchAssignments exist, strictly follow them.
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

        res.json(students);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching students' });
    }
};
