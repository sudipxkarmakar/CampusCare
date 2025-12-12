import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const fixUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to DB');

        const idToFix = '10800222062';

        // Find the user (likely stored as employeeId because it defaulted to Teacher)
        // Or checking both just in case.
        const user = await User.findOne({
            $or: [{ employeeId: idToFix }, { rollNumber: idToFix }]
        });

        if (!user) {
            console.log(`❌ User with ID ${idToFix} not found.`);
            process.exit(1);
        }

        console.log(`Found User: ${user.name} | Role: ${user.role}`);

        // Update to Student
        user.role = 'student';
        user.rollNumber = idToFix;
        user.employeeId = undefined; // Clear this
        user.batch = '2025'; // Default
        user.section = 'A'; // Default
        user.department = 'General'; // Default

        await user.save();
        console.log(`✅ User updated successfully to STUDENT.`);
        console.log(`New State: ${user.name} | Role: ${user.role} | Roll: ${user.rollNumber}`);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixUser();
