import Subject from '../models/Subject.js';
import User from '../models/User.js';

// @desc    Create a new Subject
// @route   POST /api/subjects
// @access  HOD/Admin
export const createSubject = async (req, res) => {
    try {
        const { name, code, department, year, semester, credits, academicYear } = req.body;
        const subject = await Subject.create({ name, code, department, year, semester, credits, academicYear });
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign Teacher to Subject
// @route   POST /api/subjects/assign-teacher
// @access  HOD
export const assignTeacherToSubject = async (req, res) => {
    try {
        const { subjectId, subjectCode, teacherId, academicYear } = req.body;

        let query = {};
        if (subjectId) {
            query._id = subjectId;
        } else {
            // Find subject by code and academicYear (Legacy or fallback)
            query = { code: subjectCode };
            if (academicYear) query.academicYear = academicYear;
        }

        const subject = await Subject.findOne(query); // Fixed: Restored missing query execution

        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        if (!subject.teachers.includes(teacherId)) {
            subject.teachers.push(teacherId);
            await subject.save();

            // Also update Teacher profile (reverse link)
            await User.findByIdAndUpdate(teacherId, {
                $addToSet: { teachingSubjects: subject.name }
            });
        }

        res.json({ message: 'Teacher assigned successfully', subject });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a Subject
// @route   DELETE /api/subjects/:id
// @access  HOD
export const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findById(id);

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // 1. Dependency Check: Routine
        // Import Routine dynamically or at top if not circular (Dynamic is safer here if not top-level)
        const Routine = (await import('../models/Routine.js')).default;
        const routineUsage = await Routine.findOne({ subject: id });

        if (routineUsage) {
            return res.status(400).json({
                message: 'Cannot delete subject because it is assigned to a Routine. Please remove it from the routine first.'
            });
        }

        // 2. Dependency Cleanup: Teachers (User model)
        // Remove subject name from teachers' teachingSubjects array
        // We find all teachers who have this subject assigned (legacy or batch)
        // The 'teachers' array in Subject model tracks this.
        if (subject.teachers && subject.teachers.length > 0) {
            await User.updateMany(
                { _id: { $in: subject.teachers } },
                { $pull: { teachingSubjects: subject.name } }
            );
        }

        // 3. Delete the subject
        await Subject.findByIdAndDelete(id);

        console.log(`Subject deleted: ${subject.name} (${subject.code})`);
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Get Subjects by Dept & Year
// @route   GET /api/subjects?dept=CSE&year=2nd Year
export const getSubjects = async (req, res) => {
    try {
        const { dept, year, academicYear, semester } = req.query;
        const query = {};
        if (dept) query.department = dept;
        if (year) query.year = year;
        if (academicYear) query.academicYear = academicYear;
        if (semester) {
            // Handle both number and string storage to be safe
            query.semester = { $in: [parseInt(semester), semester.toString()] };
            console.log('Filtering subjects by semester:', query.semester);
        }

        const subjects = await Subject.find(query)
            .populate('teachers', 'name')
            .populate('batchAssignments.teacher', 'name');



        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
