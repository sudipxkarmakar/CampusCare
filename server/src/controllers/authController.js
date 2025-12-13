import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// --- VALIDATION HELPERS ---
// const isValidEmail = (email) => {
//     const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com'];
//     const domain = email.split('@')[1];
//     return allowedDomains.includes(domain);
// };

const validateRoleData = (role, data) => {
    const { rollNumber, employeeId, batch, section, department } = data;

    if (role === 'student') {
        if (!/^\d{11}$/.test(rollNumber)) return 'Student Roll Number must be exactly 11 digits.';
        if (!batch) return 'Batch is required for Students.';
        if (!section) return 'Section is required for Students.';
        if (!department) return 'Department is required for Students.';
        return null;
    }

    if (role === 'teacher') {
        if (!/^T\d{11}$/.test(employeeId)) return 'Employee ID must start with T followed by 11 digits.';
        if (!department) return 'Department is required for Teachers.';
        return null; // Batch/Section not required
    }

    if (role === 'hosteler') {
        if (!/^H\d{11}$/.test(rollNumber)) return 'Hostel Roll Number must start with H followed by 11 digits.';
        if (!batch) return 'Batch is required for Hostelers.';
        if (!department) return 'Department is required for Hostelers.';
        return null;
    }

    return 'Invalid Role';
};

// @desc    Register a new user (Strict)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, rollNumber, employeeId, batch, section, department, bloodGroup } = req.body;

        // 1. Email Domain Check - REMOVED
        // if (!isValidEmail(email)) {
        //     return res.status(400).json({ message: 'Email must be @gmail.com, @yahoo.com, or @outlook.com' });
        // }

        // 2. Role specific validation
        const validationError = validateRoleData(role, req.body);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        // 3. Check for duplicates (Specific Checks)
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'User with this Email already exists.' });
        }

        let idQuery;
        if (role === 'teacher') {
            idQuery = { employeeId };
        } else {
            // Students & Hostelers: Roll Number is unique ONLY within the department
            idQuery = { rollNumber, department };
        }

        const idExists = await User.findOne(idQuery);

        if (idExists) {
            const idType = role === 'teacher' ? 'Employee ID' : 'Roll Number in this Department';
            return res.status(400).json({ message: `${idType} already exists.` });
        }

        // 4. Prepare Data
        let userData = {
            name,
            email,
            password, // Store as is (In production, hash this!)
            role,
            department,
            bloodGroup
        };

        if (role === 'student' || role === 'hosteler') {
            userData.rollNumber = rollNumber;
            userData.batch = batch;
            if (role === 'student') userData.section = section;
        } else if (role === 'teacher') {
            userData.employeeId = employeeId;
        }

        // 5. Create User
        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Server Error during registration' });
    }
};

// @desc    Auth user & get token (Strict Role Based)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { identifier, password, role } = req.body;

        if (!identifier || !password || !role) {
            return res.status(400).json({ message: 'Please provide ID, Password, and Role.' });
        }

        // 1. Construct Strict Query
        let query = { role: role };

        if (role === 'student' || role === 'hosteler') {
            query.rollNumber = identifier;
            // If they provided a department (from frontend), verify it too.
            // However, current login.html hides Dept. We need to check if we can rely on Email OR strict combination.
            if (req.body.department) {
                query.department = req.body.department;
            }
        } else if (role === 'teacher') {
            query.employeeId = identifier;
        } else {
            return res.status(400).json({ message: 'Invalid Role' });
        }

        // 2. Find User
        // Issue: If Dept is NOT provided during login, and multiple users exist with same RollNo...
        // We find the first one. This is unavoidable without UI change.
        // Enhanced Logic: Try to find *all* matches.
        const users = await User.find(query);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials or Role mismatch' });
        }

        let user;
        if (users.length === 1) {
            user = users[0];
        } else {
            // Multiple users found! ambiguous.
            // If department is part of request, this shouldn't happen unless duplicate in same dept (which is blocked by register).
            // If dept NOT provided, ask for it.
            return res.status(400).json({
                message: 'Multiple users found with this ID. Please login with Email or provide Department.',
                requiresDepartment: true
            });
        }

        if (user && (user.password === password)) { // Compare plain text for now
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
            res.status(401).json({ message: 'Invalid credentials or Role mismatch' });
        }

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server Error during login' });
    }
};
