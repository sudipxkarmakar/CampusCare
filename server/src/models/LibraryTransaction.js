import mongoose from 'mongoose';

const libraryTransactionSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    issueDate: {
        type: Date,
        default: Date.now,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    returnDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['Borrowed', 'Returned', 'Overdue', 'Lost'],
        default: 'Borrowed',
    },
    fine: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

const LibraryTransaction = mongoose.model('LibraryTransaction', libraryTransactionSchema);
export default LibraryTransaction;
