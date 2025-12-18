import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Teacher or Admin
    },
    audience: {
        type: String,
        enum: ['general', 'student', 'teacher', 'hosteler', 'hod', 'principal', 'warden'],
        default: 'general',
    },
    // Specific Targeting (Smart Filtering)
    targetDept: { type: String }, // e.g. CSE
    targetYear: { type: String }, // e.g. 2nd Year
    targetBatch: { type: String }, // e.g. 1
    targetSubBatch: { type: String }, // e.g. 1-1
    date: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;
