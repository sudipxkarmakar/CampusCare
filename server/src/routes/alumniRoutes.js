import express from 'express';
import Alumni from '../models/Alumni.js';
import User from '../models/User.js'; // Ensure User model is available for population if needed

const router = express.Router();

// @route   GET /api/alumni
// @desc    Get all alumni profiles
// @access  Public
router.get('/', async (req, res) => {
    try {
        const alumni = await Alumni.find()
            .populate('user', 'name email role') // Populate user details
            .sort({ graduationYear: -1 });
        res.json(alumni);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
