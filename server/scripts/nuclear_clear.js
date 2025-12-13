import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const nuclearClear = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'komal.it.aec@gmail.com';
        const rollNumber = 'H10800222013';
        const possibleTeacherID = 'T10800222013'; // Just in case

        console.log(`🧹 Attempting to delete users with:\nEmail: ${email}\nRoll: ${rollNumber}\nEmpID: ${possibleTeacherID}`);

        const r1 = await User.deleteMany({ email: email });
        console.log(`Deleted ${r1.deletedCount} users by Email.`);

        const r2 = await User.deleteMany({ rollNumber: rollNumber });
        console.log(`Deleted ${r2.deletedCount} users by RollNumber.`);

        const r3 = await User.deleteMany({ employeeId: possibleTeacherID });
        console.log(`Deleted ${r3.deletedCount} users by EmployeeID.`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

nuclearClear();
