import mongoose from 'mongoose';

const marMoocSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    platform: {
        type: String, // e.g., Coursera, NPTEL, Udemy
        required: true,
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
        enum: ['Proposed', 'Ongoing', 'Completed', 'Verified'],
        default: 'Proposed',
    }
}, { timestamps: true });

const MarMooc = mongoose.model('MarMooc', marMoocSchema);
export default MarMooc;
