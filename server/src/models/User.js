import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'hod', 'admin', 'hosteler', 'alumni', 'librarian'],
        default: 'student',
    },
    // Student Specific
    rollNumber: {
        type: String,
        sparse: true,
    },
    batch: String,
    section: String,
    bloodGroup: String, // New Field

    // Staff Specific
    employeeId: {
        type: String,
        sparse: true,
    },

    // Common for Student/Teacher    // Hosteler & Student Common
    batch: { type: String }, // For Student & Hosteler

    // Hosteler Specific
    hostelName: { type: String },
    roomNumber: { type: String },

    // Teacher Specific
    designation: { type: String },
    yearsExperience: { type: Number },
    joiningYear: { type: Number },
    specialization: { type: String },

    // Assignment & Other refs
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date },
    // Common for Student/Teacher/Hosteler
    department: {
        type: String, // e.g. 'CSE'
    },

    // Relationships (Optional based on requirements)
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    mentees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
