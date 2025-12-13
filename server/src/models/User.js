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
