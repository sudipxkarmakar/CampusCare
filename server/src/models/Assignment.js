import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    link: {
        type: String, // Optional URL for notes
    },
    subject: {
        type: String,
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Target Audience
    department: {
        type: String,
        required: true,
    },
    batch: {
        type: String, // e.g., "2025"
        required: true,
    },
    section: {
        type: String, // e.g., "A" (Optional if for whole batch)
    },
    deadline: {
        type: Date,
        required: true,
    },
    // submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }] // later
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
