import Complaint from '../models/Complaint.js';
import { analyzeComplaint } from '../utils/aiService.js';

// @desc    File a new complaint
// @route   POST /api/complaints
export const fileComplaint = async (req, res) => {
    const { title, description, studentId } = req.body;

    try {
        // AI Processing
        const analysis = analyzeComplaint(title + " " + description);

        // --- MOCK MODE ---
        if (global.MOCK_MODE) {
            return res.status(201).json({
                message: 'Complaint filed successfully (MOCK MODE)',
                complaint: {
                    _id: 'mock_id_' + Date.now(),
                    title,
                    description,
                    category: analysis.category,
                    priority: analysis.priority,
                    status: 'Submitted',
                    upvotes: 0,
                    createdAt: new Date(),
                    student: studentId || 'mock_student'
                },
                aiNote: `Auto-classified as ${analysis.category} with ${analysis.priority} priority.`
            });
        }

        const complaint = await Complaint.create({
            title,
            description,
            student: studentId,
            category: analysis.category,
            priority: analysis.priority,
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
    if (global.MOCK_MODE) {
        return res.json([
            {
                _id: 'c1',
                title: 'Mock: Fire in Wire',
                description: 'Sparks observed in Hallway 3',
                category: 'Electrical',
                priority: 'Urgent',
                status: 'In Progress',
                upvotes: 15,
                createdAt: new Date(),
                student: { name: 'Mock Student' }
            },
            {
                _id: 'c2',
                title: 'Mock: Water Leak',
                description: 'Tap broken in washroom',
                category: 'Sanitation',
                priority: 'Medium',
                status: 'Submitted',
                upvotes: 3,
                createdAt: new Date(Date.now() - 86400000),
                student: { name: 'Rahul Kumar' }
            }
        ]);
    }

    try {
        const complaints = await Complaint.find()
            .populate('student', 'name department')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upvote a complaint
// @route   POST /api/complaints/:id/upvote
export const upvoteComplaint = async (req, res) => {
    try {
        // --- MOCK MODE ---
        if (global.MOCK_MODE) {
            return res.json({
                _id: req.params.id,
                title: 'Mock Complaint',
                upvotes: 11, // Simulated increment
                status: 'In Progress'
            });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Not found' });

        complaint.upvotes += 1;
        await complaint.save();

        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
