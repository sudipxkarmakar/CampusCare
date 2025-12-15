import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    link: {
        type: String,
        // required: true, 
    },
    file: {
        type: String,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    grade: String,
    feedback: String
}, { timestamps: true });

// Prevent multiple submissions for same assignment by same student
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
