import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const verifyTeacherBG = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const empId = 'T9998889999'; // T + 11 digits

        // Cleanup
        await User.deleteMany({ employeeId: empId });

        console.log('--- Registering Teacher with Blood Group B+ ---');
        await User.create({
            name: 'Blood Group Teacher',
            email: 'teacher.bg@gmail.com',
            password: 'password',
            role: 'teacher',
            employeeId: empId,
            department: 'ME',
            bloodGroup: 'B+'
        });

        // Verify
        const user = await User.findOne({ employeeId: empId });
        if (user && user.bloodGroup === 'B+') {
            console.log('✅ SUCCESS: Teacher registered and Blood Group "B+" retrieved successfully.');
        } else {
            console.log('❌ FAILURE: Blood Group not saved for Teacher. Got:', user ? user.bloodGroup : 'No User');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

verifyTeacherBG();
