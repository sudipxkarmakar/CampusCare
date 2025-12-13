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
        type: String,
        required: true,
    },
    semester: {
        type: String, // e.g., "6"
    }
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);
export default Note;
