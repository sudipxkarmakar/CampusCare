import Notice from '../models/Notice.js';

// @desc    Get Notices based on Role
// @route   GET /api/notices
export const getNotices = async (req, res) => {
    let role = req.query.role || 'public';
    role = role.toLowerCase(); // Normalize to lowercase

    // Mock Mode Logic (Simplified)
    if (global.MOCK_MODE) {
        return res.json([]);
    }

    try {
        // Default: General + Public (Legacy)
        let filter = { audience: { $in: ['general', 'public'] } };

        if (role === 'teacher') {
            filter = { audience: { $in: ['general', 'public', 'teacher'] } };
        } else if (role === 'student') {
            filter = { audience: { $in: ['general', 'public', 'student'] } };
        } else if (role === 'hosteler') {
            filter = { audience: { $in: ['general', 'public', 'student', 'hosteler'] } };
        }

        const notices = await Notice.find(filter)
            .sort({ date: -1 })
            .limit(20);

        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Notice
// @route   POST /api/notices
export const createNotice = async (req, res) => {
    const { title, content, audience, userId } = req.body;
    try {
        const notice = await Notice.create({
            title,
            content,
            audience,
            postedBy: userId
        });
        res.status(201).json(notice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
