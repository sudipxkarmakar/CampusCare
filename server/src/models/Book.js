import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    isbn: {
        type: String,
        unique: true,
    },
    category: {
        type: String,
        default: 'General'
    },
    totalCopies: {
        type: Number,
        default: 1,
    },
    availableCopies: {
        type: Number,
        default: 1,
    },
    location: {
        type: String, // e.g., 'Shelf 5, Row 3'
    }
}, { timestamps: true });

const Book = mongoose.model('Book', bookSchema);
export default Book;
