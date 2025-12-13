import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Marksheet', 'Certificate', 'Identity Proof', 'Other'],
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);
export default Document;
