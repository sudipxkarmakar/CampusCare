
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import jwt from 'jsonwebtoken';
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

const getToken = async () => {
    await connectDB();
    const user = await User.findOne({ rollNumber: '1001' });
    if (!user) { process.exit(); }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
    console.log(token);
    process.exit();
};

getToken();
