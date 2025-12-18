import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String, // e.g., CS101
        required: true,
        // Unique per academicYear (handled by compound index)
    },
    department: {
        type: String, // e.g., CSE
        required: true,
    },
    year: {
        type: String, // e.g., "1st Year", "2nd Year"
        required: true,
    },
    academicYear: {
        type: String, // e.g., "2026", "2027"
        required: true
    },
    semester: {
        type: Number, // 1 to 8
    },
    batch: {
        type: String, // e.g., "Batch 1", "Batch 2" (Optional, for labs etc)
    },
    credits: {
        type: Number,
        default: 3
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Made optional as subjects might be created before teacher assignment
    },
    // Assigned Faculty (handled here for direct lookup)
    teachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // New structure for Batch-wise assignment
    batchAssignments: [{
        batch: { type: String, required: true }, // "Batch 1", "Batch 2"
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, { timestamps: true });

// Compound index to ensure subject code is unique per academic year
subjectSchema.index({ code: 1, academicYear: 1 }, { unique: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
