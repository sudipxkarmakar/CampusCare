import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Book from '../src/models/Book.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const books = [
    // CSE
    { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'CSE', totalCopies: 5, availableCopies: 5, isbn: '9780262033848' },
    { title: 'Clean Code', author: 'Robert C. Martin', category: 'CSE', totalCopies: 3, availableCopies: 0, isbn: '9780132350884' },
    { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', category: 'CSE', totalCopies: 4, availableCopies: 2, isbn: '9780201616224' },
    { title: 'Design Patterns', author: 'Erich Gamma', category: 'CSE', totalCopies: 2, availableCopies: 1, isbn: '9780201633610' },

    // IT
    { title: 'Information Technology Project Management', author: 'Kathy Schwalbe', category: 'IT', totalCopies: 4, availableCopies: 4, isbn: '9781285452340' },
    { title: 'Web Development and Design', author: 'Terry Felke-Morris', category: 'IT', totalCopies: 5, availableCopies: 3, isbn: '9780133571783' },

    // ECE
    { title: 'Microelectronic Circuits', author: 'Sedra & Smith', category: 'ECE', totalCopies: 10, availableCopies: 8, isbn: '9780195323030' },
    { title: 'Digital Logic Design', author: 'Morris Mano', category: 'ECE', totalCopies: 6, availableCopies: 0, isbn: '9780132129374' },

    // Mechanical (Keeping for completeness or removing if user strictly wants only 4? adhering to user's list but keeping extra data usually hurts less)
    { title: 'Fluid Mechanics', author: 'Frank M. White', category: 'Mechanical', totalCopies: 5, availableCopies: 5, isbn: '9780073398273' },

    // CIVIL
    { title: 'Structural Analysis', author: 'R.C. Hibbeler', category: 'CIVIL', totalCopies: 3, availableCopies: 3, isbn: '9780132570534' },
    { title: 'Surveying Vol. 1', author: 'B.C. Punmia', category: 'CIVIL', totalCopies: 5, availableCopies: 0, isbn: '9788170088530' },
    { title: 'Building Materials', author: 'S.K. Duggal', category: 'CIVIL', totalCopies: 4, availableCopies: 2, isbn: '9788122433791' },

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
