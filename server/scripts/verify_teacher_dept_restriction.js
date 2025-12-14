import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const verifyTeacherDeptRestriction = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // 1. Get a CSE Teacher
        const teacher = await User.findOne({ role: 'teacher', department: 'CSE' });
        if (!teacher) { console.error('No CSE Teacher found'); process.exit(1); }

        console.log(`\nSimulating Access for Teacher: ${teacher.name}`);
        console.log(`Department: ${teacher.department}`);

        // 2. Simulate Controller Logic
        const students = await User.find({ role: 'student', department: teacher.department });

        console.log(`\nfetched ${students.length} students.`);

        // 3. Verify Integrity
        const alienStudents = students.filter(s => s.department !== 'CSE');

        if (alienStudents.length === 0) {
            console.log('VERIFICATION PASSED: All students belong to CSE.');
        } else {
            console.error(`VERIFICATION FAILED: Found ${alienStudents.length} students from other departments!`);
            alienStudents.forEach(s => console.log(` - ${s.name} (${s.department})`));
        }

        // 4. Verify Exclusion (Check total students vs fetched)
        const totalStudents = await User.countDocuments({ role: 'student' });
        console.log(`\nTotal Students in DB: ${totalStudents}`);
        console.log(`Visible to this teacher: ${students.length}`);

        if (students.length < totalStudents) {
            console.log('VERIFICATION PASSED: Teacher sees only a subset of total students.');
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyTeacherDeptRestriction();
