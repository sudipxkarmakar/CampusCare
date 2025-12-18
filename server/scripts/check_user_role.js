
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
        const student = await User.findOne({ rollNumber: '1001' });
        if (student) {
            console.log(`User Found: ${student.name}`);
            console.log(`Role: '${student.role}'`); // Enclose in quotes to check for whitespace
            console.log(`ID: ${student._id}`);
        } else {
            console.log('User 1001 not found');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkUser();
