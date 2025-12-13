import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Create a dummy admin user just to populate the Collection
        const dummyUser = {
            name: 'System Admin',
            email: 'admin@system.local',
            password: 'system_password_secure',
            role: 'admin',
            department: 'IT'
        };

        const existing = await User.findOne({ email: dummyUser.email });
        if (!existing) {
            await User.create(dummyUser);
            console.log('✅ Created dummy user "System Admin" to initialize Database.');
        } else {
            console.log('ℹ️ Dummy user already exists.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

seedDB();
