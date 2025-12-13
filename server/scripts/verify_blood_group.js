import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const verifyBloodGroup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const roll = 'H9998889991';

        // Cleanup
        await User.deleteMany({ rollNumber: roll });

        console.log('--- Registering User with Blood Group O+ ---');
        await User.create({
            name: 'Blood Group Test User',
            email: 'blood.test@gmail.com',
            password: 'password',
            role: 'student',
            rollNumber: roll,
            department: 'CSE',
            batch: '2025',
            section: 'A',
            bloodGroup: 'O+'
        });

        // Verify
        const user = await User.findOne({ rollNumber: roll });
        if (user && user.bloodGroup === 'O+') {
            console.log('✅ SUCCESS: User registered and Blood Group "O+" retrieved successfully.');
        } else {
            console.log('❌ FAILURE: Blood Group not saved. Got:', user ? user.bloodGroup : 'No User');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        // Cleanup
        // await User.deleteMany({ rollNumber: roll }); 
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

verifyBloodGroup();
