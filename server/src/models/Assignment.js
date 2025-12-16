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
        type: String, // e.g., 'CSE'
        required: true,
    },
    year: {
        type: String, // e.g., '2nd Year'
    },
    batch: {
        type: String, // e.g., '1' or '2'
        required: true,
    },
    subBatch: {
        type: String, // e.g., '1-1' (Optional, for 25 students)
    },
    section: {
        type: String,
    },
    deadline: {
        type: Date,
        // required: true, // Made optional for Notes
    },
    type: {
        type: String,
        enum: ['assignment', 'note'],
        default: 'assignment'
    }
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
