
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkUser = async () => {
    try {
        await connectDB();
        console.log("Checking for User 1001...");

        const user = await User.findOne({ rollNumber: '1001' }).select('+password');

        if (user) {
            console.log("✅ User Found:");
            console.log(`   - Name: ${user.name}`);
            console.log(`   - Role: ${user.role}`);
            console.log(`   - Password Hash: ${user.password ? 'User has password' : 'NO PASSWORD'}`);
        } else {
            console.log("❌ User 1001 NOT FOUND in database.");
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkUser();
