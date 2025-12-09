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
        enum: ['student', 'teacher', 'hod', 'admin'],
        default: 'student',
    },
    // Student Specific
    rollNumber: {
        type: String,
        unique: true,
        sparse: true, // Unique if exists
    },
    batch: String,
    section: String,
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // Staff Specific
    employeeId: {
        type: String,
        unique: true,
        sparse: true,
    },
    department: {
        type: String, // e.g., 'CSE', 'MEFA'
    },
    mentees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    // Helper/Staff could also be handled here
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
