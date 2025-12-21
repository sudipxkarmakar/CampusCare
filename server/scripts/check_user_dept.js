
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check for users with name Sudip
        const users = await User.find({ name: { $regex: 'Sudip', $options: 'i' } });
        console.log(`Found ${users.length} users matching 'Sudip'.`);

        users.forEach(u => {
            console.log(`- Name: ${u.name}, Role: ${u.role}, Dept: '${u.department}', ID: ${u._id}`);
        });

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
