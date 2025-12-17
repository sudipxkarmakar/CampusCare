
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
        const user = await User.findOne({ rollNumber: '1001' });
        console.log("User 1001:", user);

        // Check finding by role + rollNumber (what login does)
        const loginQuery = { role: 'student', rollNumber: '1001' };
        const loginUser = await User.findOne(loginQuery);
        console.log("Login Query Result:", loginUser ? "Found" : "Not Found");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkUser();
