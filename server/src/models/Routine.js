import mongoose from 'mongoose';

const routineSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true,
    },
    timeSlot: {
        type: String, // e.g. "10:00 - 11:00"
        required: true,
    },
    year: {
        type: String, // e.g. "2nd Year"
        required: true,
    },
    semester: {
        type: Number, // e.g. 7
        required: false, // Optional for now to avoid breaking existing
    },
    department: {
        type: String, // e.g., 'CSE'
        required: true,
    },
    batch: {
        type: String, // e.g., '1'
        required: true,
    },
    // Explicitly defining subject reference
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    },
    // Explicitly defining subjectName for caching
    subjectName: {
        type: String,
        default: ''
    },
    // Explicitly defining teacher reference
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // Explicitly defining room
    room: {
        type: String,
        default: ''
    },
    subBatch: { type: String },
    period: { type: Number },
}, { timestamps: true });

const Routine = mongoose.model('Routine', routineSchema);
export default Routine;
