import AcademicLeader from '../models/AcademicLeader.js';

// @desc    Get all Academic Leaders
// @route   GET /api/academic-leaders
export const getAcademicLeaders = async (req, res) => {
    try {
        // Sort by priority (1 is highest) then by name
        const leaders = await AcademicLeader.find({}).sort({ priority: 1, name: 1 });
        res.json(leaders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
