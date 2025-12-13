import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'komal.it.aec@gmail.com';
        const rollNumber = 'H10800222013';

        console.log(`🔍 Checking for Email: ${email} OR RollNumber: ${rollNumber}`);

        const userByEmail = await User.findOne({ email });
        if (userByEmail) {
            console.log('⚠️ Found User by EMAIL:', userByEmail);
        } else {
            console.log('✅ No user found with this Email.');
        }

        const userByRoll = await User.findOne({ rollNumber });
        if (userByRoll) {
            console.log('⚠️ Found User by ROLL NUMBER:', userByRoll);
        } else {
            console.log('✅ No user found with this Roll Number.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

checkUser();
