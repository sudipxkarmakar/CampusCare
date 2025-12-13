import mongoose from 'mongoose';

const routineSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true,
    },
    period: {
        type: Number, // 1, 2, 3...
        required: true,
    },
    startTime: {
        type: String, // e.g. "10:00 AM"
    },
    endTime: {
        type: String, // e.g. "11:00 AM"
    },
    subject: {
        type: String,
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    roomNumber: {
        type: String,
    },
    batch: {
        type: String, // e.g., '2025'
        required: true,
    },
    section: {
        type: String, // e.g., 'A'
    },
    department: {
        type: String, // e.g., 'CSE'
        required: true,
    }
}, { timestamps: true });

const Routine = mongoose.model('Routine', routineSchema);
export default Routine;
