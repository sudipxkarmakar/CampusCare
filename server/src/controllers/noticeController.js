import Notice from '../models/Notice.js';

// @desc    Get Public Notices
// @route   GET /api/notices/public
export const getPublicNotices = async (req, res) => {
    if (global.MOCK_MODE) {
        return res.json([
            {
                _id: 'n1',
                title: 'Mock: Exam Schedule Released',
                content: 'The end semester exams will start from 25th Dec.',
                date: new Date(),
                audience: 'public'
            },
            {
                _id: 'n2',
                title: 'Mock: Holiday Announcement',
                content: 'Campus closed on Friday due to heavy rains.',
                date: new Date(Date.now() - 172800000),
                audience: 'public'
            }
        ]);
    }

    try {
        const notices = await Notice.find({ audience: 'public' })
            .sort({ date: -1 })
            .limit(5);
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
