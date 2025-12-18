import Notice from '../models/Notice.js';

// @desc    Get Notices based on Role
// @route   GET /api/notices
export const getNotices = async (req, res) => {
    let role = req.query.role || 'public';
    const userId = req.query.userId;
    const userDept = req.query.department; // Passed from frontend query string
    role = role.toLowerCase();

    // Mock Mode Logic (Simplified)
    if (global.MOCK_MODE) {
        return res.json([
            { _id: 'mock_n1', title: 'Mock: Exam Schedule', content: 'Final exams start Dec 15th.', audience: 'student', date: new Date(), postedBy: 'mock_admin' },
            { _id: 'mock_n2', title: 'Mock: Faculty Meeting', content: 'Staff meeting at 4 PM.', audience: 'teacher', date: new Date(), postedBy: 'mock_admin' },
            { _id: 'mock_n3', title: 'Mock: General Holiday', content: 'College closed Friday.', audience: 'general', date: new Date(), postedBy: 'mock_admin' },
            { _id: 'mock_n4', title: 'Mock: CSE Dept Notice', content: 'Only for CSE.', audience: 'general', targetDept: 'CSE', date: new Date(), postedBy: 'mock_hod' }
        ]);
    }

    try {
        // Base Audience Filter
        let audienceList = ['general', 'public'];

        if (role === 'student') {
            audienceList = ['student', 'general'];
        } else if (role === 'teacher') {
            audienceList = ['teacher', 'general', 'student', 'hosteler'];
        } else if (role === 'hosteler') {
            audienceList = ['student', 'hosteler', 'general'];
        } else if (role === 'hod') {
            audienceList = ['teacher', 'general', 'student', 'hosteler'];
        } else if (role === 'warden') {
            audienceList = ['student', 'hosteler', 'general', 'teacher', 'hod'];
        }

        // Construct Query
        // 1. Audience must be relevant
        // 2. Department Filter: 
        //    - If notice has NO targetDept -> Show it (General)
        //    - If notice HAS targetDept -> Show ONLY if matches userDept
        // 3. User's own posts are always visible

        let query;

        // Special Case: Wardens and Admins see ALL relevant audience notices, ignoring department
        if (role === 'warden' || role === 'admin') {
            query = {
                audience: { $in: audienceList }
                // No targetDept check, so they see notices for all departments
            };
        } else {
            // Standard User: Must match Audience AND (General OR My Dept)
            query = {
                $or: [
                    {
                        audience: { $in: audienceList },
                        $or: [
                            { targetDept: { $exists: false } },
                            { targetDept: userDept },
                            { targetDept: null },
                            { targetDept: "" }
                        ]
                    },
                    ...(userId ? [{ postedBy: userId }] : [])
                ]
            };
        }

        const notices = await Notice.find(query)
            .sort({ date: -1 })
            .limit(50);

        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Notice
// @route   POST /api/notices
export const createNotice = async (req, res) => {
    const { title, content, audience, userId, targetDept } = req.body;
    try {
        const notice = await Notice.create({
            title,
            content,
            audience,
            targetDept: targetDept || undefined, // Only save if provided
            postedBy: userId
        });
        res.status(201).json(notice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Notice
// @route   DELETE /api/notices/:id
export const deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        await notice.deleteOne();
        res.json({ message: 'Notice removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
