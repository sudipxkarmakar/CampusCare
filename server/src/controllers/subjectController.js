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
        const subject = await Subject.findById(req.params.id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        await Subject.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        const subjects = await Subject.find(query).populate('teachers', 'name');

        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
