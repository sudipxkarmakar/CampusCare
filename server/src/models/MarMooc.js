import mongoose from 'mongoose';

const marMoocSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: {
        type: String,
        enum: ['mar', 'mooc'],
        required: true
    },
    title: {
        type: String, // Course Name or Activity Name
        required: true,
    },
    platform: {
        type: String, // e.g., Coursera (for MOOC) or 'NSS' (for MAR)
        required: false, // Not always needed for MAR
    },
    completionDate: {
        type: Date,
    },
    certificateUrl: {
        type: String,
    },
    points: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['Proposed', 'Ongoing', 'Completed', 'Verified', 'Rejected'],
        default: 'Proposed',
    }
}, { timestamps: true });

const MarMooc = mongoose.model('MarMooc', marMoocSchema);
export default MarMooc;
