import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config({ path: 'server/.env' });

const debugHod = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Find HOD
        const hod = await User.findOne({ role: 'hod' });
        if (!hod) {
            console.log('No HOD found!');
            process.exit(1);
        }

        console.log('HOD Found:', {
            name: hod.name,
            email: hod.email,
            department: hod.department,
            role: hod.role
        });

        if (!hod.department) {
            console.error('CRITICAL: HOD has no department assigned!');
        }

        // 2. Simulate User Query
        const students = await User.find({ role: 'student', department: hod.department })
            .select('rollNumber name batch year email section');

        console.log(`Found ${students.length} students for Dept ${hod.department}`);
        if (students.length > 0) {
            console.log('Sample Student:', students[0]);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
};

debugHod();
