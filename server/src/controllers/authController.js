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
    const { rollNumber, employeeId, batch, section, department, hostelName, roomNumber } = data;

    if (role === 'student') {
        // if (!/^\d{11}$/.test(rollNumber)) return 'Student Roll Number must be exactly 11 digits.';
        if (!batch) return 'Batch is required for Students.';
        if (!section) return 'Section is required for Students.';
        if (!department) return 'Department is required for Students.';
        return null;
    }

    if (role === 'teacher' || role === 'hod' || role === 'warden') {
        if (!employeeId || employeeId.length < 5) return 'Valid Employee ID is required.';
        if (!department) return 'Department is required for Teachers/HODs/Wardens.';
        return null; // Batch/Section not required
    }

    if (role === 'hosteler') {
        // if (!/^H\d{11}$/.test(rollNumber)) return 'Hostel Roll Number must start with H followed by 11 digits.';
        if (!department) return 'Department is required for Hostelers.';
        if (!hostelName) return 'Hostel Name is required for Hostelers.';
        if (!roomNumber) return 'Room Number is required for Hostelers.';
        // Batch not strictly required for hostelers in some systems, but keeping it optional or required based on user need. 
        // Let's keep it required as per previous logic if it was there, or optional. 
        // Previous logic had: if (!batch) return 'Batch is required...'. Let's keep it.
        if (!batch) return 'Batch is required for Hostelers.';

        return null;
    }

    return 'Invalid Role';
};

// @desc    Register a new user (Strict)
// @route   POST /api/auth/register
// @access  Public
// ... imports

// Mock User Data
const MOCK_USER = {
    _id: 'mock_user_id_123',
    name: 'Mock User',
    email: 'mock@example.com',
    role: 'student',
    department: 'CSE',
    batch: '2024',
    section: 'A',
    rollNumber: '12345678901'
};

// @desc    Register a new user (Strict)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    if (global.MOCK_MODE) {
        console.log('⚡ Mock Registration Successful');
        return res.status(201).json({
            _id: MOCK_USER._id,
            name: req.body.name || MOCK_USER.name,
            email: req.body.email || MOCK_USER.email,
            role: req.body.role || MOCK_USER.role,
            token: generateToken(MOCK_USER._id),
        });
    }

    try {
        const { name, email, contactNumber, password, role, rollNumber, employeeId, year, batch, section, department, bloodGroup, hostelName, roomNumber, designation, yearsExperience, joiningYear, specialization } = req.body;

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
        // ...
        let idQuery;
        if (role === 'teacher' || role === 'hod' || role === 'warden') {
            idQuery = { employeeId };
        } else {
            // Students & Hostelers: Roll Number is unique ONLY within the department
            idQuery = { rollNumber, department };
        }

        const idExists = await User.findOne(idQuery);

        if (idExists) {
            const idType = (role === 'teacher' || role === 'hod' || role === 'warden') ? 'Employee ID' : 'Roll Number in this Department';
            return res.status(400).json({ message: `${idType} already exists.` });
        }

        // 4. Prepare Data
        let userData = {
            name,
            email,
            contactNumber,
            password, // Store as is (In production, hash this!)
            role,
            department,
            bloodGroup
        };

        if (role === 'student') {
            userData.rollNumber = rollNumber;
            userData.year = year;
            userData.batch = batch;
            userData.section = section;
        } else if (role === 'hosteler') {
            userData.rollNumber = rollNumber;
            userData.year = year;
            userData.batch = batch;
            userData.hostelName = hostelName;
            userData.roomNumber = roomNumber;
        } else if (role === 'teacher' || role === 'hod' || role === 'warden') {
            userData.employeeId = employeeId;
            userData.designation = designation;
            userData.yearsExperience = yearsExperience;
            userData.joiningYear = joiningYear;
            userData.specialization = specialization;
        }

        // 5. Handle Profile Picture
        if (req.file) {
            // Convert to relative path for generic "static" serving
            // Current path: c:\.../docs/uploads/profiles/filename.jpg
            // We want: /uploads/profiles/filename.jpg
            const relativePath = `/uploads/profiles/${req.file.filename}`;
            userData.profilePicture = relativePath;
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
    if (global.MOCK_MODE) {
        console.log('⚡ Mock Login Successful');
        return res.json({
            _id: MOCK_USER._id,
            name: MOCK_USER.name,
            email: MOCK_USER.email,
            role: req.body.role || MOCK_USER.role,
            department: MOCK_USER.department,
            batch: MOCK_USER.batch,
            section: MOCK_USER.section,
            token: generateToken(MOCK_USER._id),
        });
    }

    try {
        const { identifier, password, role } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Please provide ID/Email and Password.' });
        }

        console.log('flexible login for:', identifier);

        // Broad Search QueryRequest
        let query = {};

        if (identifier.includes('@')) {
            query = { email: identifier };
        } else {
            // Search in both RollNumber and EmployeeId if role not specified or strictly
            // Since we want to remove role restriction, we search both.
            // However, rollNumber is sparse unique, employeeId is sparse unique.
            // We can use $or.
            query = {
                $or: [
                    { rollNumber: identifier },
                    { employeeId: identifier }
                ]
            };

            // If department is provided (e.g. for student disambiguation in rare cases), add it? 
            // Broad search usually finds the unique user.
            if (req.body.department) {
                // If department provided, it applies to valid fields
                // But $or structure makes strict $and tricky without complex nesting or aggregation.
                // Let's rely on global uniqueness of identifiers first. 
                // If duplicates exist (same rollNo in diff depts?), we handle below.
            }
        }

        // 2. Find User
        const users = await User.find(query);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        let user;
        if (users.length === 1) {
            user = users[0];
        } else {
            // Multiple users found (e.g. Identical Roll No in different Depts and no Email used)
            if (req.body.department) {
                user = users.find(u => u.department === req.body.department);
                if (!user) return res.status(401).json({ message: 'Invalid credentials for this Department' });
            } else {
                return res.status(400).json({
                    message: 'Multiple users found. Please login with Email or provide Department.',
                    requiresDepartment: true
                });
            }
        }

        if (user && (user.password === password)) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role, // Return DB role
                department: user.department,
                batch: user.batch,
                section: user.section,

                rollNumber: user.rollNumber,
                employeeId: user.employeeId,
                hostelName: user.hostelName, // Return hostel info if needed
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server Error during login' });
    }
};
// @desc    Get User Profile (Full Details)
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload Profile Picture
// @route   POST /api/auth/profile-picture
// @access  Private
export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.user._id);

        if (user) {
            // Path relative to static serve 'docs' folder
            // File saved in docs/uploads/profiles/filename.ext
            // Served at http://localhost:5000/uploads/profiles/filename.ext
            user.profilePicture = `/uploads/profiles/${req.file.filename}`;
            await user.save();

            res.json({
                message: 'Profile picture updated',
                profilePicture: user.profilePicture
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
