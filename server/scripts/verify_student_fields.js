import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyUpdate = async () => {
    try {
        await connectDB();

        console.log('--- SAMPLE CHECK ---');
        // Check random student
        const student = await User.findOne({ role: 'student' });

        if (student) {
            console.log(`Name: ${student.name}`);
            console.log(`MAR: ${student.mar} (Type: ${typeof student.mar})`);
            console.log(`MOOCS: ${student.moocs} (Type: ${typeof student.moocs})`);
            console.log(`Attendance: ${student.attendance}%`);
            console.log(`CGPA: ${student.cgpa}`);

            if (student.xp === undefined && student.streak === undefined) {
                console.log("✅ Verified: 'xp' and 'streak' fields are removed/undefined.");
            } else {
                console.log("❌ Warning: 'xp' or 'streak' still exist.");
            }
        } else {
            console.log("No students found.");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
verifyUpdate();
