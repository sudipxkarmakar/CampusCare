import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { analyzeComplaint, sendFeedback } from '../utils/aiService.js';

// @desc    File a new complaint
// @route   POST /api/complaints
// @desc    File a new complaint
// @route   POST /api/complaints
export const fileComplaint = async (req, res) => {
    const { title, description, studentId, againstUser } = req.body;

    try {
        // AI Processing
        const analysis = await analyzeComplaint(title + " " + description);

        // --- MOCK MODE ---
        // --- MOCK MODE REMOVED: ALWAYS SAVE TO DB ---


        const complaint = await Complaint.create({
            title,
            description,
            student: studentId,
            category: analysis.category,
            priority: analysis.priority,
            againstUser: againstUser || null
        });

        res.status(201).json({
            message: 'Complaint filed successfully',
            complaint,
            aiNote: `Auto-classified as ${analysis.category} with ${analysis.priority} priority.`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all complaints (Public Wall)
// @route   GET /api/complaints
export const getComplaints = async (req, res) => {
    // --- MOCK MODE ---
    // --- MOCK MODE REMOVED: ALWAYS FETCH FROM DB ---


    try {
        const complaints = await Complaint.find()
            .populate('student', 'name department')
            .sort({ createdAt: -1 })
            .lean();

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upvote a complaint (Toggle Like)
// @route   POST /api/complaints/:id/upvote
export const upvoteComplaint = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const userId = req.user._id;
        const complaintId = req.params.id;

        // Atomic Update: Only update if user is NOT in upvotedBy array
        const complaint = await Complaint.findOneAndUpdate(
            { _id: complaintId, upvotedBy: { $ne: userId } },
            {
                $inc: { upvotes: 1 },
                $push: { upvotedBy: userId }
            },
            { new: true }
        );

        if (complaint) {
            // Success: User was added and count incremented
            return res.json(complaint);
        } else {
            // Failure: Either complaint doesn't exist OR user already upvoted
            // Check if complaint exists to give correct error
            const existing = await Complaint.findById(complaintId);

            if (!existing) {
                return res.status(404).json({ message: 'Complaint not found' });
            } else {
                // Complaint exists, so the query failed because user was in upvotedBy
                return res.status(400).json({ message: 'You have already upvoted this complaint.' });
            }
        }
    } catch (error) {
        console.error('Upvote Error:', error); // Log for debugging
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get complaints relevant to the logged-in teacher (By Mentees OR Against Me)
// @route   GET /api/complaints/mentees
export const getMenteeComplaints = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const teacher = await User.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const menteeIds = teacher.mentees || [];

        // Find complaints where:
        // 1. student is in menteeIds (By Mentees)
        // OR
        // 2. againstUser is me (Against Me)
        const complaints = await Complaint.find({
            $or: [
                { student: { $in: menteeIds } },
                { againstUser: teacherId }
            ]
        })
            .populate('student', 'name department roomNumber rollNumber')
            .populate('againstUser', 'name designation')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update complaint status (Resolve/Escalate)
// @route   PUT /api/complaints/:id/status
export const updateComplaintStatus = async (req, res) => {
    const { status } = req.body; // 'Resolved', 'In Progress'

    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        complaint.status = status;
        if (status === 'Resolved') {
            complaint.resolvedBy = req.user._id;
        }
        await complaint.save();

        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Correct complaint category/priority and Feedback Loop
// @route   PUT /api/complaints/:id/correct
export const correctComplaint = async (req, res) => {
    const { category, priority } = req.body;

    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // 1. Update Database
        complaint.category = category;
        complaint.priority = priority;
        await complaint.save();

        // 2. Send Feedback to AI for retraining
        // Combine title and description for better context
        const fullText = complaint.title + " " + complaint.description;
        await sendFeedback(fullText, category, priority);

        res.json({
            message: 'Complaint corrected and AI retraining triggered.',
            complaint
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Uplift (Forward) a complaint
// @route   PUT /api/complaints/:id/uplift
export const upliftComplaint = async (req, res) => {
    const { target } = req.body; // 'HOD', 'Warden', 'Principal'

    if (!['HOD', 'Warden', 'Principal'].includes(target)) {
        return res.status(400).json({ message: 'Invalid target for uplift' });
    }

    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        complaint.status = 'In Progress'; // Automatically set to in-progress if forwarded
        complaint.isUplifted = true;
        complaint.upliftedTo = target;

        await complaint.save();

        res.json(complaint);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error uplifting complaint' });
    }
};

// @desc    Get My Complaints (Hosteler)
// @route   GET /api/complaints/my
export const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ student: req.user._id })
            .populate('againstUser', 'name')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
