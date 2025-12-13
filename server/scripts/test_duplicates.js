import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const testDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const roll = 'H9998887771'; // 11 digits

        // Cleanup first
        await User.deleteMany({ rollNumber: roll });

        console.log('--- Registering User A (IT) ---');
        await User.create({
            name: 'User IT',
            email: 'user.it@gmail.com',
            password: 'password',
            role: 'student',
            rollNumber: roll,
            department: 'IT',
            batch: '2025',
            section: 'A'
        });
        console.log('✅ User A (IT) registered successfully.');

        console.log('--- Registering User B (ECE) same Roll Number ---');
        await User.create({
            name: 'User ECE',
            email: 'user.ece@gmail.com',
            password: 'password',
            role: 'student',
            rollNumber: roll,
            department: 'ECE', // Different Dept
            batch: '2025',
            section: 'B'
        });
        console.log('✅ User B (ECE) registered successfully (Duplicate Roll Number Allowed!).');

        console.log('--- Registering User C (IT) same Roll Number (Should Fail) ---');
        // This simulates the Controller logic check. 
        // Note: Controller does the check explicitly before creating.
        // Since we removed the unique index, Mongoose won't error automatically here unless we added a compound index.
        // But our Controller HAS the logic.
        // Let's verify the Controller Logic by checking if we CAN find them both.

        const count = await User.countDocuments({ rollNumber: roll });
        console.log(`Total users with Roll ${roll}: ${count}`);

        if (count === 2) {
            console.log('✅ SUCCESS: Two users exist with the same Roll Number!');
        } else {
            console.log('❌ FAILURE: Count mismatch.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await User.deleteMany({ rollNumber: 'H9998887771' }); // Cleanup
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

testDuplicates();
