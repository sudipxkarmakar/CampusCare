
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Document from '../src/models/Document.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedDocuments = async () => {
    await connectDB();

    try {
        const student = await User.findOne({ role: 'student', rollNumber: '1001' });
        if (!student) {
            console.log('Student 1001 not found! Seeding aborted.');
            process.exit(1);
        }

        // Check if doc exists
        const existingDoc = await Document.findOne({ user: student._id, title: 'Sample Marksheet' });
        if (existingDoc) {
            console.log('Sample document already exists.');
            process.exit(0);
        }

        await Document.create({
            user: student._id,
            title: 'Sample Marksheet',
            type: 'Marksheet',
            description: 'Seeded sample document',
            fileUrl: '/uploads/documents/sample_marksheet.pdf'
        });

        console.log('✅ Sample Document Seeded Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding document:', error);
        process.exit(1);
    }
};

seedDocuments();
