import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Subject from '../src/models/Subject.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const listSubjects = async () => {
    try {
        await connectDB();

        console.log("--- Subject Sample ---");
        // Find 1st year subjects for all departments (usually common ones like Math/Physics)
        // My script named them "CSE Subject 1-1", "IT Subject 1-1"

        const subjects = await Subject.find({ year: '1st Year' }).sort({ code: 1 }).limit(10);

        subjects.forEach(s => {
            console.log(`[${s.department}] ${s.code}: ${s.name}`);
        });

        const total = await Subject.countDocuments();
        console.log(`\nTotal Subjects: ${total}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

listSubjects();
