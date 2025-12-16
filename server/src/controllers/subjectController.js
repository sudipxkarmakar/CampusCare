import Subject from '../models/Subject.js';
import User from '../models/User.js';

// @desc    Create a new Subject
// @route   POST /api/subjects
// @access  HOD/Admin
export const createSubject = async (req, res) => {
    try {
        const { name, code, department, year, semester, credits } = req.body;
        const subject = await Subject.create({ name, code, department, year, semester, credits });
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
        const { subjectCode, teacherId } = req.body;

        const subject = await Subject.findOne({ code: subjectCode });
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

// @desc    Get Subjects by Dept & Year
// @route   GET /api/subjects?dept=CSE&year=2nd Year
export const getSubjects = async (req, res) => {
    try {
        const { dept, year } = req.query;
        const query = {};
        if (dept) query.department = dept;
        if (year) query.year = year;

        const subjects = await Subject.find(query).populate('teachers', 'name');
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
