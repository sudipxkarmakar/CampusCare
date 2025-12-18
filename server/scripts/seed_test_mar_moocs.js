import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import MarMooc from '../src/models/MarMooc.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedMarMoocs = async () => {
    try {
        await connectDB();

        // 1. Find the test student
        const student = await User.findOne({ rollNumber: '1001' }); // Targeted user from screenshot
        if (!student) {
            console.log('Test student (Roll 1200) not found. Checking for others...');
            return;
        }

        console.log(`Seeding data for ${student.name} (${student._id})`);

        // 2. Clear existing
        await MarMooc.deleteMany({ student: student._id });

        // 3. Create Sample Records
        const records = [
            {
                student: student._id,
                category: 'mar',
                title: 'NSS Camp Participation',
                platform: 'College',
                points: 20,
                status: 'Verified',
                completionDate: new Date('2024-11-15')
            },
            {
                student: student._id,
                category: 'mar',
                title: 'Tech Fest Volunteer',
                platform: 'Campus',
                points: 10,
                status: 'Completed',
                completionDate: new Date('2024-10-20')
            },
            {
                student: student._id,
                category: 'mooc',
                title: 'Python for Everybody',
                platform: 'Coursera',
                points: 20,
                status: 'Verified',
                completionDate: new Date('2024-08-10')
            },
            {
                student: student._id,
                category: 'mooc',
                title: 'Machine Learning Basics',
                platform: 'Udemy',
                points: 10,
                status: 'Ongoing'
            }
        ];

        await MarMooc.insertMany(records);
        console.log('✅ Seeding Complete. Added 4 records.');

        // Update user totals (optional if aggregated on fly, but good practice)
        student.mar = 30;
        student.moocs = 30; // 20 verified + 10 ongoing (maybe?)
        await student.save();

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedMarMoocs();
