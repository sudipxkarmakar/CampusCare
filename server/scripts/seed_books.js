import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Book from '../src/models/Book.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const books = [
    // Computer Science
    { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'Computer Science', totalCopies: 5, availableCopies: 5, isbn: '9780262033848' },
    { title: 'Clean Code', author: 'Robert C. Martin', category: 'Computer Science', totalCopies: 3, availableCopies: 0, isbn: '9780132350884' },
    { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', category: 'Computer Science', totalCopies: 4, availableCopies: 2, isbn: '9780201616224' },
    { title: 'Design Patterns', author: 'Erich Gamma', category: 'Computer Science', totalCopies: 2, availableCopies: 1, isbn: '9780201633610' },

    // ECE
    { title: 'Microelectronic Circuits', author: 'Sedra & Smith', category: 'ECE', totalCopies: 10, availableCopies: 8, isbn: '9780195323030' },
    { title: 'Digital Logic Design', author: 'Morris Mano', category: 'ECE', totalCopies: 6, availableCopies: 0, isbn: '9780132129374' },

    // Mechanical
    { title: 'Fluid Mechanics', author: 'Frank M. White', category: 'Mechanical', totalCopies: 5, availableCopies: 5, isbn: '9780073398273' },
    { title: 'Thermodynamics: An Engineering Approach', author: 'Yunus A. Cengel', category: 'Mechanical', totalCopies: 4, availableCopies: 1, isbn: '9780073398174' },

    // Civil
    { title: 'Structural Analysis', author: 'R.C. Hibbeler', category: 'Civil', totalCopies: 3, availableCopies: 3, isbn: '9780132570534' },
    { title: 'Surveying Vol. 1', author: 'B.C. Punmia', category: 'Civil', totalCopies: 5, availableCopies: 0, isbn: '9788170088530' },
    { title: 'Building Materials', author: 'S.K. Duggal', category: 'Civil', totalCopies: 4, availableCopies: 2, isbn: '9788122433791' },

    // General
    { title: 'The Alchemist', author: 'Paulo Coelho', category: 'General', totalCopies: 3, availableCopies: 3, isbn: '9780062315007' },
    { title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', category: 'General', totalCopies: 2, availableCopies: 0, isbn: '9780590353427' }
];

const seedBooks = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        await Book.deleteMany({});
        console.log('🧹 Cleared existing books');

        await Book.insertMany(books);
        console.log(`📚 Added ${books.length} books`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedBooks();
