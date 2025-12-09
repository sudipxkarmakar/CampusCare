import User from '../models/User.js';
import { parseRollNumber } from '../utils/rollParser.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user (Student or Staff)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { name, email, password, rollNumber, employeeId, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let userData = {
            name,
            email,
            password, // In a real app, hash this!
            role,
        };

        // Automatic Parsing for Students
        if (role === 'student' && rollNumber) {
            const parsedData = parseRollNumber(rollNumber);
            if (!parsedData) {
                return res.status(400).json({ message: 'Invalid Roll Number Format' });
            }
            userData = {
                ...userData,
                rollNumber,
                department: parsedData.dept,
                batch: parsedData.batch,
                section: parsedData.section,
            };
        } else if (role !== 'student' && employeeId) {
            userData.employeeId = employeeId;
            // Department for teachers might be manual or parsed from ID if standard exists
            if (req.body.department) userData.department = req.body.department;
        }

        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { identifier, password } = req.body;

    // --- MOCK MODE FALLBACK ---
    if (global.MOCK_MODE) {
        console.log('Attempting Mock Login for:', identifier);

        // Mock Student
        if (identifier === 'CSE-2025-045' && password === 'password123') {
            return res.json({
                _id: 'mock_student_id_123',
                name: 'Rahul Kumar (Mock)',
                email: 'rahul@campus.com',
                role: 'student',
                department: 'CSE',
                batch: '2025',
                section: 'A',
                token: 'mock_token_123',
            });
        }

        // Mock Teacher
        if (identifier === 'T-101' && password === 'password123') {
            return res.json({
                _id: 'mock_teacher_id_456',
                name: 'Prof. Sharma (Mock)',
                email: 'sharma@campus.com',
                role: 'teacher',
                department: 'CSE',
                token: 'mock_token_456',
            });
        }

        return res.status(401).json({ message: 'Invalid credentials (Mock Mode)' });
    }
    // ---------------------------

    try {
        // Try finding by Email, Roll Number, or Employee ID
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { rollNumber: identifier },
                { employeeId: identifier }
            ]
        });

        if (user && (user.password === password)) { // Simple check for demo
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                batch: user.batch,
                section: user.section,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email/ID or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
