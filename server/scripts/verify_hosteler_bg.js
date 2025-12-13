import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const verifyHostelerBG = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const roll = 'H9998889999'; // 11 digits

        // Cleanup
        await User.deleteMany({ rollNumber: roll });

        console.log('--- Registering Hosteler with Blood Group AB- ---');
        // Simulating the backend call directly (since backend code was agnostic)
        await User.create({
            name: 'Blood Group Hosteler',
            email: 'hostel.bg@gmail.com',
            password: 'password',
            role: 'hosteler',
            rollNumber: roll,
            department: 'CE',
            batch: '2025',
            bloodGroup: 'AB-'
        });

        // Verify
        const user = await User.findOne({ rollNumber: roll });
        if (user && user.bloodGroup === 'AB-') {
            console.log('✅ SUCCESS: Hosteler registered and Blood Group "AB-" retrieved successfully.');
        } else {
            console.log('❌ FAILURE: Blood Group not saved for Hosteler. Got:', user ? user.bloodGroup : 'No User');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

verifyHostelerBG();
