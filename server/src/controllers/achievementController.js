import Achievement from '../models/Achievement.js';

// @desc    Get achievements
//          - HOD / principal: all (pending + approved + rejected)
//          - Everyone else: only approved
// @route   GET /api/achievements
export const getAchievements = async (req, res) => {
    try {
        // If an auth token is present, check if the user is an authority
        const role = (req.user?.role || 'guest').toLowerCase();
        const isAuthority = ['hod', 'principal', 'admin', 'dean'].includes(role);

        const filter = isAuthority ? {} : { status: 'approved' };

        const achievements = await Achievement.find(filter)
            .sort({ priority: 1, createdAt: -1 })
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
    const submitterRole = (req.user.role || '').toLowerCase();

    if (!['teacher', 'hod', 'principal'].includes(submitterRole)) {
        return res.status(403).json({ message: 'Only teachers, HODs, and principals can submit achievements.' });
    }

    try {
        // HODs and principals auto-approve their own submissions
        const autoApprove = ['hod', 'principal'].includes(submitterRole);

        const achievement = new Achievement({
            title,
            description,
            category: category || 'other',
            year: year || new Date().getFullYear(),
            image: image || null,
            priority: priority || 10,
            submittedBy: req.user._id,
            submittedByRole: submitterRole,
            status: autoApprove ? 'approved' : 'pending',
            verifiedBy: autoApprove ? req.user._id : null,
            verifiedByRole: autoApprove ? submitterRole : null,
        });

        const saved = await achievement.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update an achievement (hod / principal)
// @route   PUT /api/achievements/:id
export const updateAchievement = async (req, res) => {
    const role = (req.user.role || '').toLowerCase();
    if (!['hod', 'principal'].includes(role)) {
        return res.status(403).json({ message: 'Only HODs and Principals can update achievements.' });
    }

    const { title, description, category, year, priority, image } = req.body;

    try {
        const achievement = await Achievement.findById(req.params.id);
        if (!achievement) return res.status(404).json({ message: 'Achievement not found.' });

        if (title !== undefined) achievement.title = title;
        if (description !== undefined) achievement.description = description;
        if (category !== undefined) achievement.category = category;
        if (year !== undefined) achievement.year = year;
        if (priority !== undefined) achievement.priority = priority;
        if (image !== undefined) achievement.image = image;

        // Keep status approved after edit (HOD is authoritative)
        achievement.status = 'approved';
        achievement.verifiedBy = req.user._id;
        achievement.verifiedByRole = role;

        const updated = await achievement.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all PENDING achievements (hod / principal can see & verify)
// @route   GET /api/achievements/pending
export const getPendingAchievements = async (req, res) => {
    const role = (req.user.role || '').toLowerCase();
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
    const { status, rejectionReason } = req.body;
    const role = (req.user.role || '').toLowerCase();

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

// @desc    Delete an achievement (hod / principal)
// @route   DELETE /api/achievements/:id
export const deleteAchievement = async (req, res) => {
    const role = (req.user.role || '').toLowerCase();
    if (!['hod', 'principal'].includes(role)) {
        return res.status(403).json({ message: 'Only HODs and Principals can delete achievements.' });
    }
    try {
        const achievement = await Achievement.findByIdAndDelete(req.params.id);
        if (!achievement) return res.status(404).json({ message: 'Achievement not found.' });
        res.json({ message: 'Achievement deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
