
import MarMooc from '../models/MarMooc.js';
import User from '../models/User.js';

// @desc    Get MAR/MOOC records for logged in student
// @route   GET /api/mar-moocs
// @access  Student
export const getStudentMarMoocs = async (req, res) => {
    try {
        const records = await MarMooc.find({ student: req.user._id }).sort({ createdAt: -1 });

        const marPoints = records
            .filter(r => r.category === 'mar')
            .reduce((acc, curr) => acc + (curr.points || 0), 0);

        const moocCredits = records
            .filter(r => r.category === 'mooc')
            .reduce((acc, curr) => acc + (curr.points || 0), 0);

        res.json({
            records,
            totals: {
                mar: marPoints,
                mooc: moocCredits
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

};

// @desc    Submit new MAR or MOOC record
// @route   POST /api/mar-moocs
// @access  Student
export const submitMarMooc = async (req, res) => {
    try {
        const { category, title, platform, points, link } = req.body;

        // Basic Validation
        if (!category || !title || !points) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        // Prevent Duplicates
        const existing = await MarMooc.findOne({
            student: req.user._id,
            category,
            title
        });

        if (existing) {
            return res.status(400).json({
                message: `You have already submitted an entry for '${title}'. Duplicates are not allowed.`
            });
        }

        const newRecord = await MarMooc.create({
            student: req.user._id,
            category,
            title,
            platform: platform || 'Self',
            points,
            certificateUrl: link || '',
            status: 'Proposed' // Default status
        });

        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
