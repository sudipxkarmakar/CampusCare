import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['academic', 'sports', 'research', 'cultural', 'placement', 'award', 'other'],
        default: 'other',
    },
    year: {
        type: Number,
        default: () => new Date().getFullYear(),
    },
    image: {
        type: String, // Optional image/icon URL
        default: null,
    },
    // Who submitted it
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // teacher, hod, or principal
        required: true,
    },
    submittedByRole: {
        type: String,
        enum: ['teacher', 'hod', 'principal'],
        required: true,
    },
    // Verification status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // hod or principal
        default: null,
    },
    verifiedByRole: {
        type: String,
        enum: ['hod', 'principal', null],
        default: null,
    },
    rejectionReason: {
        type: String,
        default: null,
    },
    // Display priority (lower = shown first)
    priority: {
        type: Number,
        default: 10,
    },
}, { timestamps: true });

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
