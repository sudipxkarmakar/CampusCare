
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Notice from '../src/models/Notice.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedNotices = async () => {
    try {
        await connectDB();

        console.log("Adding Personal Notices...");

        // Find an admin or teacher to be the 'poster'
        const poster = await User.findOne({ role: { $in: ['admin', 'teacher'] } });
        if (!poster) {
            console.log("No poster found, ensuring at least one teacher exists first.");
            process.exit(1);
        }

        const notices = [
            // 1. CA Assignment (Preserve/Recreate)
            {
                title: 'CA Assignment Submission Deadline',
                content: 'Students are informed that the final date for submission of internal assignments is 18 December 2025. Late submissions will not be accepted.',
                postedBy: poster._id,
                audience: 'student', // Student Only
                date: new Date(),
                targetDept: 'IT' // Targeted
            },
            // 2. Library Book Due (Personal Example)
            {
                title: 'Library Overdue: Data Structures',
                content: 'You have an overdue book "Data Structures Using C". Please return it to the library by tomorrow to avoid fines.',
                postedBy: poster._id,
                audience: 'student',
                date: new Date(),
                targetDept: 'IT'
            },
            // 3. Holiday (General/Student)
            {
                title: 'Winter Vacation Announcement',
                content: 'The college will remain closed for Winter Break from 25th Dec to 1st Jan. Happy Holidays!',
                postedBy: poster._id,
                audience: 'general', // General
                date: new Date()
            }
        ];

        // Ensure no duplicates before inserting
        for (const n of notices) {
            const exists = await Notice.findOne({ title: n.title });
            if (!exists) {
                await Notice.create(n);
                console.log(`+ Added: ${n.title}`);
            } else {
                console.log(`= Skipped (Exists): ${n.title}`);
            }
        }

        console.log("✅ Personal Notices Seeded.");
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedNotices();
