import Achievement from '../models/Achievement.js';

// @desc    Get all APPROVED achievements (public)
// @route   GET /api/achievements
export const getAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.find({ status: 'approved' })
            .sort({ priority: 1, year: -1, createdAt: -1 })
            .populate('submittedBy', 'name role department')
            .lean();
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit a new achievement (teacher / hod / principal)
// @route   POST /api/achievements
export const createAchievement = async (req, res) => {
    const { title, description, category, year, image, priority } = req.body;
    const submitterRole = req.user.role;

    if (!['teacher', 'hod', 'principal'].includes(submitterRole)) {
        return res.status(403).json({ message: 'Only teachers, HODs, and principals can submit achievements.' });
    }

    try {
        const achievement = new Achievement({
            title,
            description,
            category: category || 'other',
            year: year || new Date().getFullYear(),
            image: image || null,
            priority: priority || 10,
            submittedBy: req.user._id,
            submittedByRole: submitterRole,
            // Principals auto-approve their own submissions
            status: submitterRole === 'principal' ? 'approved' : 'pending',
            verifiedBy: submitterRole === 'principal' ? req.user._id : null,
            verifiedByRole: submitterRole === 'principal' ? 'principal' : null,
        });

        const saved = await achievement.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all PENDING achievements (hod / principal can see & verify)
// @route   GET /api/achievements/pending
export const getPendingAchievements = async (req, res) => {
    const role = req.user.role;
    if (!['hod', 'principal'].includes(role)) {
        return res.status(403).json({ message: 'Only HODs and Principals can view pending achievements.' });
    }
    try {
        const achievements = await Achievement.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .populate('submittedBy', 'name role department')
            .lean();
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or Reject an achievement
// @route   PATCH /api/achievements/:id/verify
export const verifyAchievement = async (req, res) => {
    const { status, rejectionReason } = req.body; // status: 'approved' | 'rejected'
    const role = req.user.role;

    if (!['hod', 'principal'].includes(role)) {
        return res.status(403).json({ message: 'Only HODs and Principals can verify achievements.' });
    }
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status must be "approved" or "rejected".' });
    }

    try {
        const achievement = await Achievement.findById(req.params.id);
        if (!achievement) return res.status(404).json({ message: 'Achievement not found.' });
        if (achievement.status !== 'pending') {
            return res.status(400).json({ message: 'Achievement has already been verified.' });
        }

        achievement.status = status;
        achievement.verifiedBy = req.user._id;
        achievement.verifiedByRole = role;
        achievement.rejectionReason = status === 'rejected' ? (rejectionReason || null) : null;

        const updated = await achievement.save();
        await updated.populate('submittedBy', 'name role');
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an achievement (principal only)
// @route   DELETE /api/achievements/:id
export const deleteAchievement = async (req, res) => {
    if (req.user.role !== 'principal') {
        return res.status(403).json({ message: 'Only the principal can delete achievements.' });
    }
    try {
        const achievement = await Achievement.findByIdAndDelete(req.params.id);
        if (!achievement) return res.status(404).json({ message: 'Achievement not found.' });
        res.json({ message: 'Achievement deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
