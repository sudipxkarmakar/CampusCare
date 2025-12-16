import MessMenu from '../models/MessMenu.js';
import Leave from '../models/Leave.js';

// @desc    Get Mess Menu
// @route   GET /api/hostel/mess
// @access  Public/Auth
export const getMessMenu = async (req, res) => {
    try {
        const menu = await MessMenu.find({});
        res.json(menu);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error menu' });
    }
};

// @desc    Update Mess Menu (Dean/Admin)
// @route   PUT /api/hostel/mess
// @access  Dean/Admin
export const updateMessMenu = async (req, res) => {
    try {
        const { day, breakfast, lunch, snacks, dinner } = req.body;

        let menu = await MessMenu.findOne({ day });
        if (menu) {
            menu.breakfast = breakfast;
            menu.lunch = lunch;
            menu.snacks = snacks;
            menu.dinner = dinner;
            await menu.save();
        } else {
            menu = await MessMenu.create({ day, breakfast, lunch, snacks, dinner });
        }

        res.json(menu);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error update menu' });
    }
};

// @desc    Apply for Leave
// @route   POST /api/hostel/leave
// @access  Hosteler
export const applyLeave = async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body;

        const leave = await Leave.create({
            student: req.user._id,
            type,
            startDate,
            endDate,
            reason,
            status: 'Pending'
        });

        res.status(201).json(leave);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error leave' });
    }
};

// @desc    Get My Leaves
// @route   GET /api/hostel/my-leaves
// @access  Hosteler
export const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ student: req.user._id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error my leaves' });
    }
};
