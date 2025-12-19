import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js'; // Adjust path if needed
import connectDB from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const assignMentors = async () => {
    try {
        await connectDB();
        console.log('Database Connected.');

        // 1. Find all teachers
        const teachers = await User.find({ role: 'teacher' });
        if (teachers.length === 0) {
            console.log('No teachers found. Cannot assign mentors.');
            process.exit(1);
        }
        console.log(`Found ${teachers.length} teachers.`);

        // 2. Find hostelers without mentors (or ALL hostelers to be safe?)
        // Let's find those where mentor is not set
        const hostelers = await User.find({
            role: 'hosteler',
            $or: [
                { mentor: { $exists: false } },
                { mentor: null }
            ]
        });

        console.log(`Found ${hostelers.length} hostelers needing mentors.`);

        if (hostelers.length === 0) {
            console.log('No hostelers need mentors.');
            process.exit(0);
        }

        // 3. Round-robin assignment
        let teacherIndex = 0;
        let updatedCount = 0;

        for (const hosteler of hostelers) {
            const mentor = teachers[teacherIndex];

            hosteler.mentor = mentor._id;
            await hosteler.save();

            updatedCount++;
            console.log(`Assigned ${hosteler.name} -> Mentor: ${mentor.name}`);

            // Move to next teacher
            teacherIndex = (teacherIndex + 1) % teachers.length;
        }

        console.log(`Successfully assigned mentors to ${updatedCount} hostelers.`);
        process.exit();

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

assignMentors();
