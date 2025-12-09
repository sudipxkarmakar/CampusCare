import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import { parseRollNumber } from './src/utils/rollParser.js';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Create Student
        const studentExists = await User.findOne({ rollNumber: 'CSE-2025-045' });
        if (!studentExists) {
            const { dept, batch, section } = parseRollNumber('CSE-2025-045');
            await User.create({
                name: 'Rahul Kumar',
                email: 'rahul@campus.com',
                password: 'password123',
                role: 'student',
                rollNumber: 'CSE-2025-045',
                department: dept,
                batch: batch,
                section: section
            });
            console.log('Student Created: CSE-2025-045');
        } else {
            console.log('Student already exists');
        }

        // 2. Create Teacher
        const teacherExists = await User.findOne({ employeeId: 'T-101' });
        if (!teacherExists) {
            await User.create({
                name: 'Prof. Sharma',
                email: 'sharma@campus.com',
                password: 'password123',
                role: 'teacher',
                employeeId: 'T-101',
                department: 'CSE'
            });
            console.log('Teacher Created: T-101');
        } else {
            console.log('Teacher already exists');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seed();
