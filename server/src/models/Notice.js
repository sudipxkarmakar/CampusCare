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
        type: String, // 'public', 'CSE', 'Hostel', etc.
        default: 'public',
    },
    date: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;
