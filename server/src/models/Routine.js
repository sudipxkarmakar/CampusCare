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
        type: mongoose.Schema.Types.ObjectId, // Link to Subject Model
        ref: 'Subject',
        // required: true, // relaxed for now to allow string if legacy data exists
    },
    subjectName: { type: String }, // Fallback/Cache
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    roomNumber: {
        type: String,
    },
    batch: {
        type: String, // e.g., '2025' or '1'
        required: true,
    },
    subBatch: {
        type: String, // e.g., '1-1' (Optional, if routine is specific to sub-batch)
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
