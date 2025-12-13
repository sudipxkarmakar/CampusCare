import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const clearUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'komal.it.aec@gmail.com';
        const result = await User.findOneAndDelete({ email });

        if (result) {
            console.log(`🗑️ Deleted conflicting user: ${result.name} (${result.email})`);
        } else {
            console.log('ℹ️ No user found with that email to delete.');
        }

        const result2 = await User.findOneAndDelete({ rollNumber: 'H10800222013' });
        if (result2) {
            console.log(`🗑️ Deleted conflicting user by RollNo: ${result2.name}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

clearUser();
