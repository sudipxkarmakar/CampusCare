import Routine from '../models/Routine.js';
import User from '../models/User.js';

// @desc    Get Student Routine (My Class)
// @route   GET /api/routine/student
// @access  Private
export const getStudentRoutine = async (req, res) => {
    try {
        // Assume user is attached to req by middleware (or passed as query for testing)
        // For simulation, we'll take query params or body, but typically req.user

        let { department, year, batch, subBatch } = req.query;

        // If 'me' (authenticated user context)
        if (req.user && req.user.role === 'student') {
            department = req.user.department;
            year = req.user.year; // "2nd Year"
            batch = req.user.batch; // "1"
            subBatch = req.user.subBatch; // "1-1"
        }

        const query = {
            department,
            year,
            batch
        };

        // Sub-batch logic: verify if routine is specific to sub-batch or general to batch
        // If query has subBatch, match (subBatch OR null)
        if (subBatch) {
            query.$or = [
                { subBatch: subBatch },
                { subBatch: null },
                { subBatch: { $exists: false } }
            ];
        }

        const routine = await Routine.find(query)
            .populate('subject', 'name code')
            .populate('teacher', 'name')
            .sort({ day: 1, period: 1 }); // Sort by day then time

        res.json(routine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Teacher Routine (My Schedule)
// @route   GET /api/routine/teacher
// @access  Private
export const getTeacherRoutine = async (req, res) => {
    try {
        let teacherId = req.query.teacherId;

        // If authenticated
        if (req.user && req.user.role === 'teacher') {
            teacherId = req.user._id;
        }

        const routine = await Routine.find({ teacher: teacherId })
            .populate('subject', 'name code')
            .sort({ day: 1, period: 1 });

        res.json(routine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update (Upsert) Routine Slot
// @route   POST /api/routine
// @access  HOD
// @desc    Update (Upsert) Routine Slot
// @route   POST /api/routine
// @access  HOD
export const updateRoutineSlot = async (req, res) => {
    try {
        const {
            day,
            timeSlot,
            year,
            department,
            batch,
            subjectId,
            subBatch
        } = req.body;

        // Validation
        if (!day || !timeSlot || !year || !department || !batch || !subjectId) {
            console.log("Missing fields:", { day, timeSlot, year, department, batch, subjectId }); // DEBUG
            return res.status(400).json({ message: 'Missing required fields' });
        }

        console.log("UpdateRoutineSlot Request:", req.body); // DEBUG

        let teacherId = null;
        let subjectName = '';
        const Subject = (await import('../models/Subject.js')).default;

        // Handle "BREAK" case
        if (subjectId === 'BREAK') {
            subjectName = 'Break';
            teacherId = null;
        } else {
            // Fetch Subject to get Teacher
            const subjectDoc = await Subject.findById(subjectId);
            if (!subjectDoc) {
                return res.status(404).json({ message: 'Subject not found' });
            }
            subjectName = subjectDoc.name;

            // Auto-assign teacher logic
            // 1. Check batch-specific assignment
            if (subjectDoc.batchAssignments && subjectDoc.batchAssignments.length > 0) {
                const batchAssign = subjectDoc.batchAssignments.find(ba => ba.batch === batch);
                if (batchAssign && batchAssign.teacher) {
                    teacherId = batchAssign.teacher;
                }
            }

            // 2. Fallback to first teacher if not found in batch assignment
            if (!teacherId && subjectDoc.teachers && subjectDoc.teachers.length > 0) {
                teacherId = subjectDoc.teachers[0];
            }
        }

        // 1. Conflict Check: Teacher Availability
        if (teacherId) {
            const teacherConflict = await Routine.findOne({
                teacher: teacherId,
                day: day,
                timeSlot: timeSlot,
                $or: [
                    { year: { $ne: year } },
                    { batch: { $ne: batch } }
                ]
            });

            if (teacherConflict) {
                return res.status(400).json({
                    message: `Teacher is already assigned to ${teacherConflict.year} Batch ${teacherConflict.batch} at this time.`
                });
            }
        }

        // 3. Upsert Logic
        const filter = { department, year, batch, day, timeSlot };
        if (subBatch) filter.subBatch = subBatch;

        const updateData = {
            subject: subjectId === 'BREAK' ? null : subjectId, // Store null for BREAK so it doesn't try to ObjectId cast
            subjectName,
            teacher: teacherId,
            room: '', // Room removed from UI
            subBatch: subBatch || null
        };

        console.log("Update Data:", updateData); // DEBUG

        const result = await Routine.findOneAndUpdate(
            filter,
            updateData,
            { new: true, upsert: true }
        );

        console.log("DB Result:", result); // DEBUG

        res.json({ message: 'Routine updated successfully', entry: result });

    } catch (error) {
        console.error("Routine Update Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Routine Slot
// @route   DELETE /api/routine
// @access  HOD
export const deleteRoutineSlot = async (req, res) => {
    try {
        const { day, timeSlot, year, department, batch } = req.body;

        await Routine.findOneAndDelete({ day, timeSlot, year, department, batch });
        res.json({ message: 'Slot cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
