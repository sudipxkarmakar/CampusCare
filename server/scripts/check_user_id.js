
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const checkUser = async () => {
    await connectDB();
    const id = '69445b4681d7ad4cb464cb4e';
    const user = await User.findById(id);
    if (user) {
        console.log(`User found: ${user.name}`);
        console.log(`Roll: ${user.rollNumber}`);
        console.log(`Batch: '${user.batch}'`); // Quotes to see exact string
    } else {
        console.log('User not found via ID');
    }

    // Check duplication
    const users = await User.find({ rollNumber: '1001' });
    console.log(`Users with Roll 1001: ${users.length}`);
    users.forEach(u => console.log(`- ID: ${u._id}, Batch: '${u.batch}'`));

    process.exit();
};

checkUser();
