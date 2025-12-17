
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const resetPassword = async () => {
    try {
        await connectDB();
        console.log("Resetting password for 1001...");

        const user = await User.findOne({ rollNumber: '1001' });

        if (user) {
            user.password = 'password123'; // Mongoose middleware will hash this
            await user.save();
            console.log("✅ Password successfully reset to 'password123'");
        } else {
            console.log("❌ User 1001 NOT FOUND.");
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

resetPassword();
