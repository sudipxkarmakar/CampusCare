
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Book from '../src/models/Book.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const books = [
    { title: 'Building Materials', author: 'S.K. Duggal', category: 'CIVIL', totalCopies: 5, availableCopies: 5 },
    { title: 'Clean Code', author: 'Robert C. Martin', category: 'CSE', totalCopies: 10, availableCopies: 8 },
    { title: 'Design Patterns', author: 'Erich Gamma', category: 'CSE', totalCopies: 5, availableCopies: 3 },
    { title: 'Digital Logic Design', author: 'Morris Mano', category: 'ECE', totalCopies: 7, availableCopies: 7 },
    { title: 'Fluid Mechanics', author: 'Frank M. White', category: 'Mechanical', totalCopies: 4, availableCopies: 2 },
    { title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', category: 'General', totalCopies: 3, availableCopies: 0 },
    { title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', category: 'CSE', totalCopies: 5, availableCopies: 5 },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'General', totalCopies: 2, availableCopies: 2 },
    { title: 'Electronic Devices', author: 'Thomas L. Floyd', category: 'ECE', totalCopies: 6, availableCopies: 6 },
    { title: 'Concrete Technology', author: 'M.S. Shetty', category: 'CIVIL', totalCopies: 4, availableCopies: 4 }
];

const seedLibrary = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected.");

        // Clear existing books to avoid duplicates or keep adding? 
        // Let's check count first.
        const count = await Book.countDocuments();
        if (count > 0) {
            console.log(`Library already has ${count} books. Skipping seed.`);
            // Optional: Uncomment to force re-seed
            // await Book.deleteMany({});
            // console.log("Cleared existing books.");
        } else {
            await Book.insertMany(books);
            console.log(`✅ Seeded ${books.length} books into Library.`);
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedLibrary();
