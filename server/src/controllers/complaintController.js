import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import fs from 'fs';
import fetch from 'node-fetch';

const includesAny = (text, words) => words.some((word) => text.includes(word));

const classifyComplaint = (text = '') => {
    const lower = text.toLowerCase();
    let category = 'Other';
    if (includesAny(lower, ['fan', 'light', 'electric', 'power', 'wire', 'shock'])) category = 'Electrical';
    else if (includesAny(lower, ['toilet', 'washroom', 'dirty', 'clean', 'garbage', 'smell'])) category = 'Sanitation';
    else if (includesAny(lower, ['bench', 'door', 'window', 'wall', 'pipe', 'water leak'])) category = 'Civil';
    else if (includesAny(lower, ['wifi', 'internet', 'computer', 'projector', 'network'])) category = 'IT';
    else if (includesAny(lower, ['food', 'mess', 'canteen', 'meal'])) category = 'Mess';
    else if (includesAny(lower, ['ragging', 'fight', 'harassment', 'theft', 'stolen'])) category = 'Disciplinary';
    else if (includesAny(lower, ['personal', 'mentor', 'teacher', 'fever', 'headache', 'sick', 'anxiety', 'depression', 'stressed', 'medical', 'vomit', 'illness', 'doctor', 'ankle', 'injury', 'injured', 'pain', 'hurt', 'wound', 'hospital', 'accident', 'cough', 'bleed', 'bleeding', 'counseling', 'mental', 'unconscious', 'fainted', 'collapsed', 'collapse', 'fell down'])) category = 'Personal';

    let priority = 'Medium';
    if (includesAny(lower, ['fire', 'shock', 'injury', 'harassment', 'ragging', 'urgent', 'danger'])) priority = 'Urgent';
    else if (includesAny(lower, ['not working', 'broken', 'leak', 'stolen'])) priority = 'High';
    else if (includesAny(lower, ['minor', 'request', 'suggestion'])) priority = 'Low';

    return { category, priority };
};

const classifyStaff = (text = '', studentDept = '') => {
    const lower = text.toLowerCase();

    // 1. Direct multi-word/phrase/keyword matches
    // HVAC / AC Technician
    if (includesAny(lower, ['split ac', 'ac not cooling', 'ac down', 'air conditioner', 'hvac', 'ac cooling'])) {
        return { designation: 'HVAC / AC Technician', routeDept: null };
    }
    // Mess / Catering Manager
    if (includesAny(lower, ['unhygienic food', 'insect in meal', 'water cooler empty', 'dinner delayed', 'raw chapati', 'utensils dirty', 'mess', 'food', 'meal', 'canteen', 'lunch', 'dinner', 'breakfast', 'utensil'])) {
        return { designation: 'Mess / Catering Manager', routeDept: null };
    }
    // Pest Control Specialist
    if (includesAny(lower, ['mosquitoes', 'bedbugs', 'stray dog', 'stray cat', 'beehive', 'rodents', 'pest control', 'bug', 'insect', 'rodent'])) {
        return { designation: 'Pest Control Specialist', routeDept: null };
    }
    // Lab Assistant
    if (includesAny(lower, ['burning smell from cro', 'lab component', 'chemical spill', 'soldering iron', 'cro', 'chemical', 'soldering'])) {
        return { designation: 'Lab Assistants / Attendants', routeDept: studentDept };
    }
    // Network Admin
    if (includesAny(lower, ['wi-fi', 'wifi', 'internet', 'lan port', 'portal login', 'server down', 'pc not booting', 'lan', 'pc', 'login error', 'portal', 'network'])) {
        return { designation: 'Network / System Administrator (IT Support)', routeDept: null };
    }
    // Lift / Elevator
    if (includesAny(lower, ['lift stuck', 'elevator', 'lift making', 'jerky movement', 'sensor failure'])) {
        return { designation: 'Lift / Elevator Technician', routeDept: null };
    }
    // Security
    if (includesAny(lower, ['parking issue', 'unauthorized entry', 'lost bag', 'bicycle theft', 'fight near gate', 'gate pass', 'security', 'guard', 'theft', 'stolen', 'parking', 'fight', 'gate'])) {
        return { designation: 'Chief Security Officer / Guard Desk', routeDept: null };
    }
    // Grounds Manager
    if (includesAny(lower, ['broken bench in lawn', 'streetlights not working', 'football ground', 'fallen tree', 'lawn', 'ground', 'tree', 'grass', 'streetlight', 'park'])) {
        return { designation: 'Estate / Grounds Manager', routeDept: null };
    }
    // Electrician
    if (includesAny(lower, ['electrician', 'switch', 'socket', 'wire', 'fan', 'bulb', 'light', 'smartboard', 'power'])) {
        return { designation: 'Electrician', routeDept: null };
    }
    // Carpenter
    if (includesAny(lower, ['drawing board', 'desk broken', 'door lock', 'bed frame', 'cupboard', 'carpenter', 'desk', 'bed', 'drawer', 'chair', 'board'])) {
        return { designation: 'Carpenter', routeDept: null };
    }
    // Mason / Civil
    if (includesAny(lower, ['wall crack', 'ceiling plaster', 'broken floor tiles', 'roof leakage during rain', 'whitewash', 'wall', 'ceiling', 'plaster', 'tiles', 'cement', 'paint', 'painter', 'mason'])) {
        return { designation: 'Mason / Painter (Civil Maintenance)', routeDept: null };
    }
    // Plumber
    if (includesAny(lower, ['plumber', 'pipe', 'tap', 'flush', 'clogged', 'leakage', 'toilet', 'washroom'])) {
        return { designation: 'Plumber', routeDept: null };
    }
    // Housekeeping
    if (includesAny(lower, ['corridors dirty', 'garbage overflowing', 'washroom needs cleaning', 'water logging', 'housekeeping', 'clean', 'dirty', 'garbage', 'dustbin', 'sweeping', 'logging', 'common area'])) {
        return { designation: 'Housekeeping & Janitorial Supervisor', routeDept: null };
    }
    // water-related logic specifically
    if (lower.includes('water')) {
        return { designation: 'Plumber', routeDept: null };
    }

    // 3. Fallbacks based on broad classification categories
    const analysis = classifyComplaint(text);
    if (analysis.category === 'Electrical') return { designation: 'Electrician' };
    if (analysis.category === 'Sanitation') return { designation: 'Housekeeping & Janitorial Supervisor' };
    if (analysis.category === 'Civil') return { designation: 'Plumber' };
    if (analysis.category === 'IT') return { designation: 'Network / System Administrator (IT Support)' };
    if (analysis.category === 'Mess') return { designation: 'Mess / Catering Manager' };
    if (analysis.category === 'Disciplinary') return { designation: 'Chief Security Officer / Guard Desk' };

    // Default fallback
    return { designation: 'Estate / Grounds Manager' };
};

export const fileComplaint = async (req, res) => {
    fs.appendFileSync('debug_output.txt', `\nHEADERS: ${req.headers['content-type']}\nBODY: ${JSON.stringify(req.body)}\nFILE: ${req.file ? req.file.originalname : 'none'}\n`);
    const { title, description, location, againstUser } = req.body;
    const studentId = req.user._id;

    try {
        const studentUser = await User.findById(studentId);
        const studentDept = studentUser ? studentUser.department || '' : '';

        // Try to classify via FastAPI ML server, fall back to heuristic if down
        let analysis = classifyComplaint(`${title} ${description}`);
        try {
            const mlResponse = await fetch('http://127.0.0.1:8000/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: `${title} ${description}` })
            });
            if (mlResponse.ok) {
                const mlData = await mlResponse.json();
                if (mlData.category && mlData.priority) {
                    // Double-Insurance: If the local heuristic already classified it as 'Personal', do not overwrite it!
                    if (analysis.category === 'Personal') {
                        console.log(`[ML SERVICE] Heuristic safety-net identified 'Personal'. Keeping 'Personal' category, using ML priority: ${mlData.priority}`);
                        analysis.priority = mlData.priority;
                    } else {
                        analysis = {
                            category: mlData.category,
                            priority: mlData.priority
                        };
                        console.log(`[ML SERVICE] Classified via ML model: Category=${analysis.category}, Priority=${analysis.priority}`);
                    }
                }
            } else {
                console.warn(`[ML SERVICE] ML Service returned status ${mlResponse.status}. Falling back to heuristics.`);
            }
        } catch (mlError) {
            console.warn('[ML SERVICE] Could not connect to ML service. Falling back to heuristics:', mlError.message);
        }

        const staffMatch = classifyStaff(`${title} ${description}`, studentDept);

        // Find the matched staff member from DB
        let staffQuery = { role: 'staff', designation: staffMatch.designation };
        if (staffMatch.routeDept) {
            staffQuery.department = staffMatch.routeDept;
        }
        let matchedStaffUser = await User.findOne(staffQuery);
        if (!matchedStaffUser && staffMatch.routeDept) {
            matchedStaffUser = await User.findOne({ role: 'staff', designation: staffMatch.designation });
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const complaintData = {
            title,
            description,
            location: location || '',
            student: studentId,
            category: analysis.category,
            priority: analysis.priority,
            againstUser: againstUser || null
        };
        
        if (matchedStaffUser) {
            complaintData.assignedStaff = matchedStaffUser._id;
        }

        if (imageUrl) {
            complaintData.image = imageUrl;
        }

        const complaint = await Complaint.create(complaintData);

        res.status(201).json({
            message: 'Complaint filed successfully',
            complaint,
            assignedStaff: matchedStaffUser ? {
                name: matchedStaffUser.name,
                designation: matchedStaffUser.designation,
                contactNumber: matchedStaffUser.contactNumber
            } : null,
            aiNote: `Classified as ${analysis.category} with ${analysis.priority} priority and assigned to ${staffMatch.designation}.`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all complaints (Public Wall)
// @route   GET /api/complaints
export const getComplaints = async (req, res) => {
    try {
        const filter = {};
        if (req.query.public === 'true') {
            filter.category = { $ne: 'Personal' };
        }

        const complaints = await Complaint.find(filter)
            .populate('student', 'name department rollNumber roomNumber profilePicture')
            .populate('resolvedBy', 'name role profilePicture')
            .populate('assignedStaff', 'name designation contactNumber email')
            .sort({ createdAt: -1 })
            .lean();

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upvote a complaint (Toggle Like)
// @route   POST /api/complaints/:id/upvote
// @desc    Upvote a complaint (Toggle Like)
// @route   PUT /api/complaints/:id/upvote
export const upvoteComplaint = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const userId = req.user._id;
        const complaintId = req.params.id;

        // 1. Try to REMOVE upvote (Unlike)
        // Atomic Pull: Only updates if user IS in the array
        const complaintInfo = await Complaint.findOneAndUpdate(
            { _id: complaintId, upvotedBy: userId },
            {
                $inc: { upvotes: -1 },
                $pull: { upvotedBy: userId }
            },
            { new: true }
        );

        if (complaintInfo) {
            // User was found and removed -> Action: REMOVED
            return res.json({
                action: 'removed',
                upvotes: Math.max(0, complaintInfo.upvotes), // Ensure never negative
                complaint: complaintInfo
            });
        }

        // 2. If not removed, try to ADD upvote (Like)
        // Atomic Add: Only updates if user IS NOT in the array (handled naturally by flow, but $addToSet is safe)
        const complaint = await Complaint.findOneAndUpdate(
            { _id: complaintId },
            {
                $inc: { upvotes: 1 },
                $addToSet: { upvotedBy: userId }
            },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Action: ADDED
        res.json({
            action: 'added',
            upvotes: complaint.upvotes,
            complaint
        });

    } catch (error) {
        console.error('Upvote Error:', error);
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
            .populate('student', 'name department roomNumber rollNumber profilePicture')
            .populate('againstUser', 'name designation')
            .populate('resolvedBy', 'name role profilePicture')
            .populate('assignedStaff', 'name designation contactNumber email')
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

        // 2. Trigger feedback & background retraining in FastAPI ML service
        try {
            fetch('http://127.0.0.1:8000/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `${complaint.title} ${complaint.description}`,
                    category: category,
                    priority: priority
                })
            }).catch(err => console.warn('[ML SERVICE] Feedback loop failed:', err.message));
        } catch (feedbackErr) {
            console.warn('[ML SERVICE] Feedback request failed:', feedbackErr.message);
        }

        res.json({
            message: 'Complaint corrected successfully.',
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
            .populate('student', 'name department roomNumber rollNumber profilePicture')
            .populate('againstUser', 'name')
            .populate('resolvedBy', 'name role profilePicture')
            .populate('assignedStaff', 'name designation contactNumber email')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
