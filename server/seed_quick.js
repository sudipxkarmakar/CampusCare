import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import { parseRollNumber } from './src/utils/rollParser.js';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected for Seeding');

        const roll = 'CSE-2025-001';

        // Check if exists
        const exists = await User.findOne({ rollNumber: roll });
        if (exists) {
            console.log(`User ${roll} already exists. Updating password...`);
            exists.password = 'password'; // Updating to requested password
            await exists.save();
            console.log('Password updated.');
        } else {
            console.log(`Creating new user ${roll}...`);
            const { dept, batch, section } = parseRollNumber(roll);

            await User.create({
                name: 'Test Student',
                email: 'student001@campus.com',
                password: 'password', // Plain text as per user request (hashing should be handled in model pre-save if active)
                role: 'student',
                rollNumber: roll,
                department: dept,
                batch: batch,
                section: section
            });
            console.log(`User ${roll} created successfully.`);
        }

        process.exit();
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seed();
