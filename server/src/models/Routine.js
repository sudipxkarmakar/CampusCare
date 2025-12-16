import mongoose from 'mongoose';

const routineSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true,
    },
    // "timeSlot" from screenshot (replacing period/start/end strictness, or keeping them as helpers)
    timeSlot: {
        type: String, // e.g. "10:00 - 11:00" or "Period 1"
        required: true,
    },
    // "year" from screenshot
    year: {
        type: String, // e.g. "2nd Year"
        required: true,
    },
    department: {
        type: String, // e.g., 'CSE'
        required: true,
    },
    batch: {
        type: String, // e.g., '1' or '2025'
        required: true,
    },
    // "subject"
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    },
    subjectName: { type: String }, // Cache

    // "teacherId" from screenshot (mapped to 'teacher' field for mongoose ref convention, but can alias)
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // "room" from screenshot
    room: {
        type: String,
    },

    // Extras
    subBatch: { type: String },
    period: { type: Number }, // Keeping for sorting if needed
}, { timestamps: true });

const Routine = mongoose.model('Routine', routineSchema);
export default Routine;
