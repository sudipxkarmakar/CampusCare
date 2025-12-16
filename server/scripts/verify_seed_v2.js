import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifySeed = async () => {
    try {
        await connectDB();

        const total = await User.countDocuments({});
        const students = await User.countDocuments({ role: 'student' });
        const hostelers = await User.countDocuments({ role: 'hosteler' });

        console.log('--- STATS ---');
        console.log(`Total: ${total}`);
        console.log(`Students: ${students}`);
        console.log(`Hostelers: ${hostelers}`);

        console.log('\n--- SAMPLE CHECKS ---');

        const check = async (roll) => {
            const u = await User.findOne({ rollNumber: roll });
            if (u) console.log(`Roll ${roll}: ${u.name} | Role: ${u.role}`);
            else console.log(`Roll ${roll}: MISSING`);
        };

        await check("1");   // Sudip...
        await check("4");   // Sumit...
        await check("20");  // Student
        await check("21");  // Hosteler (Start of group)
        await check("25");  // Hosteler (End of group)
        await check("26");  // Student (Start of next group)
        await check("1200");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
verifySeed();
