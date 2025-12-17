
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("-- Verification Report --");

        const studentCount = await User.countDocuments({ role: 'student' });
        const hostelerCount = await User.countDocuments({ role: 'hosteler' }); // Remember hosteler is a role? Or is it student + hostelName?
        // In my seed script, I used `role: 'hosteler'` for hostelers and `role: 'student'` for day scholars.
        // Wait, the User model allows `role: 'hosteler'`. 

        const teacherCount = await User.countDocuments({ role: 'teacher' });
        const subjectCount = await Subject.countDocuments({});
        const hodCount = await User.countDocuments({ role: 'hod' });

        console.log(`Students (Day Scholar): ${studentCount}`);
        console.log(`Hostelers: ${hostelerCount}`);
        console.log(`Total 'Student' Level Users: ${studentCount + hostelerCount}`); // Should be 400
        console.log(`Teachers: ${teacherCount}`); // Should be 8
        console.log(`HODs: ${hodCount}`); // Should be 3
        console.log(`Subjects: ${subjectCount}`); // Should be 16

        // Detailed check for first 100
        const batch1Students = await User.countDocuments({ batch: '1' });
        console.log(`Batch 1 Students (Expected ~50): ${batch1Students}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verify();
