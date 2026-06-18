
import MarMooc from '../models/MarMooc.js';
import User from '../models/User.js';

// @desc    Get MAR/MOOC records for logged in student
// @route   GET /api/mar-moocs
// @access  Student
export const getStudentMarMoocs = async (req, res) => {
    try {
        const records = await MarMooc.find({ student: req.user._id }).sort({ createdAt: -1 });

        const marPoints = records
            .filter(r => r.category === 'mar' && r.status === 'Verified')
            .reduce((acc, curr) => acc + (curr.points || 0), 0);

        const moocCredits = records
            .filter(r => r.category === 'mooc' && r.status === 'Verified')
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
const MAR_SECTIONS = {
    "2a": { points: 5, max: 10 },
    "2b": { points: 3, max: 6 },
    "3": { points: 5, max: 10 },
    "4": { points: 1, max: 10 },
    "5a": { points: 5, max: 40 },
    "5b": { points: 20, max: 40 },
    "6": { points: 10, max: 20 },
    "7": { points: 10, max: 20 },
    "8": { points: 15, max: 30 },
    "9": { points: 30, max: 60 },
    "10a": { points: 8, max: 16 },
    "10b": { points: 10, max: 20 },
    "11a": { points: 10, max: 20 },
    "11b": { points: 5, max: 10 },
    "11c": { points: 10, max: 20 },
    "11d": { points: 12, max: 24 },
    "11e": { points: 15, max: 30 },
    "11f": { points: 20, max: 40 },
    "12": { points: 10, max: 20 },
    "13": { points: 10, max: 20 },
    "14": { points: 10, max: 20 },
    "15a": { points: 10, max: 20 },
    "15b": { points: 5, max: 10 },
    "15c": { points: 10, max: 20 },
    "15d": { points: 10, max: 20 },
    "15e": { points: 20, max: 40 }
};

export const submitMarMooc = async (req, res) => {
    try {
        const { category, title, platform, link, activitySection, startDate, endDate, duration } = req.body;

        // Basic Validation
        if (!category || !title) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        let calculatedPoints = 0;

        if (category === 'mar') {
            if (!activitySection) {
                return res.status(400).json({ message: 'Please select a MAR activity section.' });
            }
            const sec = MAR_SECTIONS[activitySection];
            if (!sec) {
                return res.status(400).json({ message: 'Invalid MAR activity section.' });
            }

            // Check if section is already maxed out based on verified entries
            const records = await MarMooc.find({ student: req.user._id, category: 'mar', activitySection, status: 'Verified' });
            const claimedPoints = records.reduce((acc, curr) => acc + (curr.points || 0), 0);
            if (claimedPoints + sec.points > sec.max) {
                return res.status(400).json({
                    message: `Cannot claim points under this category. Maximum allowed is ${sec.max} points, and you have already claimed/verified ${claimedPoints} points. Claiming this would exceed the limit.`
                });
            }
            calculatedPoints = sec.points;
        } else if (category === 'mooc') {
            if (!duration) {
                return res.status(400).json({ message: 'Please provide the course duration in hours.' });
            }
            const durationHrs = Number(duration);
            if (isNaN(durationHrs) || durationHrs <= 0) {
                return res.status(400).json({ message: 'Duration must be a positive number.' });
            }
            calculatedPoints = Math.min(4, Math.floor(durationHrs / 8));
            if (calculatedPoints <= 0) {
                return res.status(400).json({ message: 'Course duration must be at least 8 hours to claim credits (1 credit per 8 hours).' });
            }
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

        let certificateUrl = link || '';
        if (req.file) {
            certificateUrl = `/uploads/${req.file.filename}`;
        }

        const newRecord = await MarMooc.create({
            student: req.user._id,
            category,
            title,
            platform: platform || 'Self',
            points: calculatedPoints,
            startDate: startDate || null,
            endDate: endDate || null,
            duration: duration ? Number(duration) : null,
            activitySection: activitySection || null,
            certificateUrl,
            externalLink: link || '',
            status: 'Proposed'
        });

        // --- SYNC UPDATE: Recalculate Totals for User Profile ---
        const allRecords = await MarMooc.find({ student: req.user._id });

        const totalMar = allRecords
            .filter(r => r.category === 'mar' && r.status === 'Verified')
            .reduce((acc, curr) => acc + (curr.points || 0), 0);

        const totalMooc = allRecords
            .filter(r => r.category === 'mooc' && r.status === 'Verified')
            .reduce((acc, curr) => acc + (curr.points || 0), 0);

        console.log(`[SYNC] Updating User ${req.user._id}: MAR ${totalMar}, MOOC ${totalMooc}`);

        await User.findByIdAndUpdate(req.user._id, {
            mar: totalMar,
            moocs: totalMooc
        });
        // -------------------------------------------------------

        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


// @desc    Get submissions from mentees (Teacher only)
// @route   GET /api/mar-moocs/mentees
// @access  Teacher
export const getMenteeSubmissions = async (req, res) => {
    try {
        // Find mentees for this teacher
        const mentees = await User.find({ mentor: req.user._id });
        const menteeIds = mentees.map(m => m._id);

        const submissions = await MarMooc.find({ student: { $in: menteeIds } })
            .populate('student', 'name rollNumber batch section')
            .sort({ createdAt: -1 });

        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update submission status (Approve/Reject)
// @route   PUT /api/mar-moocs/:id/status
// @access  Teacher
export const updateMarMoocStatus = async (req, res) => {
    try {
        const { status, remark } = req.body; // status: 'Verified' or 'Rejected'
        const record = await MarMooc.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        // Optional: specific mentor check could go here, but generic Protect is ok for now

        record.status = status;
        if (remark) record.remark = remark;
        await record.save();

        // --- Recalculate Totals for Student ---
        const studentId = record.student;
        const allRecords = await MarMooc.find({ student: studentId });

        const totalMar = allRecords
            .filter(r => r.category === 'mar' && r.status === 'Verified')
            .reduce((acc, curr) => acc + (curr.points || 0), 0);

        const totalMooc = allRecords
            .filter(r => r.category === 'mooc' && r.status === 'Verified')
            .reduce((acc, curr) => acc + (curr.points || 0), 0);

        await User.findByIdAndUpdate(studentId, {
            mar: totalMar,
            moocs: totalMooc
        });
        // -------------------------------------

        res.json({ message: `Status updated to ${status}`, record });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
