import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const fixUser = async () => {
    await connectDB();

    try {
        // Find the latest student (The one the user created)
        const student = await User.findOne({ role: 'student' }).sort({ createdAt: -1 });

        if (!student) {
            console.log('No student found.');
            process.exit();
        }

        console.log(`Updating Student: ${student.name} (${student.email})`);
        console.log(`Current Year: ${student.year}, Section: ${student.section}`);

        // Update Year to '1st Year' and Section to 'A' (if missing)
        // Assuming user meant "Section A" and "1st Year" (Batch 2026?)
        // If year is invalid/undefined, set it.

        student.year = '1st Year';
        // student.section = 'A'; // Preserving section if it was already A

        await student.save();

        console.log(`Updated to Year: ${student.year}`);

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

fixUser();
