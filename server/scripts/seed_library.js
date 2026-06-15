import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Book from '../src/models/Book.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const books = [
    { title: 'Building Materials', author: 'S.K. Duggal', category: 'CIVIL', totalCopies: 5, availableCopies: 5, isbn: '978-8122433791', pdfUrl: '/assets/pdfs/building_materials.pdf' },
    { title: 'Clean Code', author: 'Robert C. Martin', category: 'CSE/IT', totalCopies: 10, availableCopies: 8, isbn: '978-0132350884', pdfUrl: '/assets/pdfs/clean_code.pdf' },
    { title: 'Design Patterns', author: 'Erich Gamma', category: 'CSE/IT', totalCopies: 5, availableCopies: 3, isbn: '978-0201633610', pdfUrl: '/assets/pdfs/design_patterns.pdf' },
    { title: 'Digital Logic Design', author: 'Morris Mano', category: 'ECE', totalCopies: 7, availableCopies: 7, isbn: '978-9332543539', pdfUrl: '/assets/pdfs/digital_logic.pdf' },
    { title: 'Fluid Mechanics', author: 'Frank M. White', category: 'Mechanical', totalCopies: 4, availableCopies: 2, isbn: '978-0073398273', pdfUrl: '/assets/pdfs/fluid_mechanics.pdf' },
    { title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', category: 'General', totalCopies: 3, availableCopies: 0, isbn: '978-0439708180', pdfUrl: '/assets/pdfs/harry_potter.pdf' },
    { title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', category: 'CSE/IT', totalCopies: 5, availableCopies: 5, isbn: '978-0262033848', pdfUrl: '/assets/pdfs/algorithms.pdf' },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'General', totalCopies: 2, availableCopies: 2, isbn: '978-0743273565', pdfUrl: '/assets/pdfs/great_gatsby.pdf' },
    { title: 'Electronic Devices', author: 'Thomas L. Floyd', category: 'ECE', totalCopies: 6, availableCopies: 6, isbn: '978-0132549868', pdfUrl: '/assets/pdfs/electronic_devices.pdf' },
    { title: 'Concrete Technology', author: 'M.S. Shetty', category: 'CIVIL', totalCopies: 4, availableCopies: 4, isbn: '978-8121901697', pdfUrl: '/assets/pdfs/concrete_technology.pdf' },
    { title: 'Web Development with Node & Express', author: 'Ethan Brown', category: 'CSE/IT', totalCopies: 8, availableCopies: 8, isbn: '978-1491949306', pdfUrl: '/assets/pdfs/node_express.pdf' },
    { title: 'Fundamentals of Thermodynamics', author: 'Claus Borgnakke', category: 'Mechanical', totalCopies: 6, availableCopies: 6, isbn: '978-1118807538', pdfUrl: '/assets/pdfs/thermodynamics.pdf' },
    { title: 'Principles of Electromagnetics', author: 'Matthew N.O. Sadiku', category: 'ECE', totalCopies: 5, availableCopies: 5, isbn: '978-0199461547', pdfUrl: '/assets/pdfs/electromagnetics.pdf' },
    { title: 'Structural Analysis', author: 'Russell C. Hibbeler', category: 'CIVIL', totalCopies: 6, availableCopies: 6, isbn: '978-0133942842', pdfUrl: '/assets/pdfs/structural_analysis.pdf' },
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'General', totalCopies: 4, availableCopies: 4, isbn: '978-0547928227', pdfUrl: '/assets/pdfs/hobbit.pdf' }
];

const seedLibrary = async () => {
    try {
        console.log("Connecting to Database: ", process.env.MONGO_URI ? "URI Found" : "URI Missing");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected.");

        // Clear existing books for fresh e-library seeding
        await Book.deleteMany({});
        console.log("Cleared existing books.");

        await Book.insertMany(books);
        console.log(`✅ Seeded ${books.length} E-Books into Library.`);

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedLibrary();
