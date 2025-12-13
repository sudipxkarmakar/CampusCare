import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const verifyAnyEmail = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const roll = 'H1112223334';

        // Cleanup
        await User.deleteMany({ rollNumber: roll });

        console.log('--- Registering with custom domain email ---');
        await User.create({
            name: 'Custom Domain User',
            email: 'user@custom-campus.net', // Previously blocked
            password: 'password',
            role: 'student',
            rollNumber: roll,
            department: 'IT',
            batch: '2026',
            section: 'C',
            bloodGroup: 'O-'
        });

        // Verify
        const user = await User.findOne({ email: 'user@custom-campus.net' });
        if (user) {
            console.log('✅ SUCCESS: User registered with @custom-campus.net email.');
        } else {
            console.log('❌ FAILURE: User not found.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

verifyAnyEmail();
