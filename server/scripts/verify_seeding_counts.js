import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const verifyCounts = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        const departments = ['CSE', 'ECE', 'ME', 'CE', 'EE'];

        console.log('--- Verification Report ---');

        for (const dept of departments) {
            const studentCount = await User.countDocuments({ role: 'student', department: dept });
            const teacherCount = await User.countDocuments({ role: 'teacher', department: dept });

            console.log(`Department: ${dept}`);
            console.log(`  Students: ${studentCount} (Expected: 60)`);
            console.log(`  Teachers: ${teacherCount} (Expected: 10)`);

            if (studentCount !== 60 || teacherCount !== 10) {
                console.error(`  MISMATCH IN ${dept}!`);
            }
        }

        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalTeachers = await User.countDocuments({ role: 'teacher' });

        console.log('---------------------------');
        console.log(`Total Students: ${totalStudents}`);
        console.log(`Total Teachers: ${totalTeachers}`);

        process.exit(0);

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
};

verifyCounts();
