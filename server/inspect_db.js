import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inspect = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/campuscare');
        console.log('MongoDB Connected');

        const Subject = (await import('./src/models/Subject.js')).default;

        // Find one subject
        const subject = await Subject.findOne().sort({ createdAt: -1 });
        if (subject) {
            console.log('Subject found:', JSON.stringify(subject, null, 2));
        } else {
            console.log('No subjects found.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

inspect();
