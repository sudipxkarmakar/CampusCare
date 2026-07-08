import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const connectionString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscare';

async function seed() {
    try {
        await mongoose.connect(connectionString);
        console.log('Connected to Database');

        const students = await User.find({ role: { $in: ['student', 'hosteler'] } });
        console.log(`Found ${students.length} students to update.`);

        for (const s of students) {
            // Generate realistic values
            let hash = 0;
            for (let i = 0; i < s.name.length; i++) {
                hash = s.name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const cgpa = parseFloat((6.0 + Math.abs(hash % 38) * 0.1).toFixed(2)); // 6.0 to 9.7
            const marPoints = Math.abs(15 + (hash % 85)); // 15 to 99
            const attendance = Math.abs(65 + (hash % 35)); // 65 to 99
            const backlogs = Math.abs(hash % 5) === 0 ? Math.abs(hash % 3) : 0;

            s.cgpa = cgpa;
            s.mar = marPoints;
            s.attendance = attendance;
            s.backlogs = backlogs;

            await s.save();
        }

        console.log('Successfully seeded CGPA, MAR points, and Attendance for all students in the database!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
