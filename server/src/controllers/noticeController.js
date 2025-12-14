import Notice from '../models/Notice.js';

// @desc    Get Notices based on Role
// @route   GET /api/notices
export const getNotices = async (req, res) => {
    let role = req.query.role || 'public';
    const userId = req.query.userId;
    role = role.toLowerCase(); // Normalize to lowercase

    // Mock Mode Logic (Simplified)
    if (global.MOCK_MODE) {
        return res.json([]);
    }

    try {
        // Base Audience Filter
        let audienceList = ['general', 'public'];
        if (role === 'teacher') audienceList.push('teacher');
        if (role === 'student') audienceList.push('student');
        if (role === 'hosteler') audienceList.push('student', 'hosteler');

        // Construct Query
        const query = {
            $or: [
                { audience: { $in: audienceList } },
                // If user is logged in, they should see their OWN posts regardless of audience
                ...(userId ? [{ postedBy: userId }] : [])
            ]
        };

        console.log(`[DEBUG] Role: ${role}, AudienceList: ${audienceList}, UserID: ${userId}`);
        console.log(`[DEBUG] Query: ${JSON.stringify(query)}`);

        const notices = await Notice.find(query)
            .sort({ date: -1 })
            .limit(20);

        console.log(`[DEBUG] Found ${notices.length} notices`);

        // Duplicate execution removed

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
