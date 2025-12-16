import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
    },
    topic: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    department: {
        type: String, // e.g., 'CSE'
        required: true,
    },
    year: {
        type: String, // e.g., '2nd Year'
    },
    batch: {
        type: String, // e.g., '1'
    },
    subBatch: {
        type: String, // e.g., '1-1'
    },
    semester: {
        type: String, // keeping for backward compatibility
    }
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);
export default Note;
