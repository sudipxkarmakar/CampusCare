import Leave from '../models/Leave.js';

// @desc    Apply for Leave
// @route   POST /api/hostel/leave
export const applyLeave = async (req, res) => {
    const { studentId, type, startDate, endDate, reason } = req.body;
    try {
        const leave = await Leave.create({
            student: studentId,
            type,
            startDate,
            endDate,
            reason
        });
        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get My Leaves
// @route   GET /api/hostel/leave/:studentId
export const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ student: req.params.studentId }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Mess Menu (Static for now)
// @route   GET /api/hostel/menu
export const getMessMenu = (req, res) => {
    const menu = {
        Monday: { Breakfast: "Aloo Paratha", Lunch: "Rice & Fish Curry", Dinner: "Chicken Stew" },
        Tuesday: { Breakfast: "Idli Sambar", Lunch: "Rice & Dal", Dinner: "Egg Curry" },
        Wednesday: { Breakfast: "Bread Omelette", Lunch: "Fried Rice", Dinner: "Paneer Butter Masala" },
        Thursday: { Breakfast: "Puri Sabji", Lunch: "Khichdi", Dinner: "Chicken Biryani" },
        Friday: { Breakfast: "Poha", Lunch: "Rice & Veggies", Dinner: "Fish Fry" },
        Saturday: { Breakfast: "Chole Bhature", Lunch: "Rice & Egg", Dinner: "Mutton Curry" },
        Sunday: { Breakfast: "Masala Dosa", Lunch: "Feast", Dinner: "Light Soup" },
    };
    res.json(menu);
};
