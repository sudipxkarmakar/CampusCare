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

// @desc    Create a new Academic Leader
// @route   POST /api/academic-leaders
export const createAcademicLeader = async (req, res) => {
    try {
        const { name, role, qualification, experience, email, department, message, priority } = req.body;

        // Image file check
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

        const leaderData = {
            name,
            role,
            qualification,
            experience,
            email,
            department,
            message,
            priority: priority ? Number(priority) : undefined
        };

        if (imageUrl) {
            leaderData.image = imageUrl;
        }

        const leader = await AcademicLeader.create(leaderData);
        res.status(201).json(leader);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an Academic Leader
// @route   DELETE /api/academic-leaders/:id
export const deleteAcademicLeader = async (req, res) => {
    try {
        const leader = await AcademicLeader.findById(req.params.id);

        if (!leader) {
            return res.status(404).json({ message: 'Academic Leader not found' });
        }

        await leader.deleteOne();
        res.json({ message: 'Academic Leader removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
