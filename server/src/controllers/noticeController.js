import Notice from '../models/Notice.js';

// @desc    Get Notices based on Role
// @route   GET /api/notices
export const getNotices = async (req, res) => {
    let role = req.query.role || 'public';
    const userId = req.query.userId;
    role = role.toLowerCase(); // Normalize to lowercase

    // Mock Mode Logic (Simplified)
    if (global.MOCK_MODE) {
        return res.json([
            {
                _id: 'mock_n1',
                title: 'Mock: Exam Schedule Released',
                content: 'Final exams start from Dec 15th.',
                audience: 'student',
                date: new Date(),
                postedBy: 'mock_admin'
            },
            {
                _id: 'mock_n2',
                title: 'Mock: Faculty Meeting',
                content: 'Staff meeting at 4 PM.',
                audience: 'teacher',
                date: new Date(),
                postedBy: 'mock_admin'
            },
            {
                _id: 'mock_n3',
                title: 'Mock: Holiday Announcement',
                content: 'College closed on Friday.',
                audience: 'general',
                date: new Date(),
                postedBy: 'mock_admin'
            }
        ]);
    }

    try {
        console.log('[DEBUG] getNotices called');
        console.log('[DEBUG] Role:', role, 'UserId:', userId);

        // Base Audience Filter
        let audienceList = ['general', 'public'];
        if (role === 'teacher') audienceList.push('teacher', 'student', 'hosteler'); // Teachers can see Student & Hosteler notices now
        if (role === 'student') audienceList.push('student');
        if (role === 'hosteler') audienceList.push('student', 'hosteler');

        console.log('[DEBUG] Audience List:', audienceList);

        // Construct Query
        const query = {
            $or: [
                { audience: { $in: audienceList } },
                // If user is logged in, they should see their OWN posts regardless of audience
                ...(userId ? [{ postedBy: userId }] : [])
            ]
        };

        console.log('[DEBUG] Notice Query:', JSON.stringify(query));

        const notices = await Notice.find(query)
            .sort({ date: -1 })
            .limit(20);

        console.log('[DEBUG] Notices found:', notices.length);

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
