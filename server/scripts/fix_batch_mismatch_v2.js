
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
        process.exit(1);
    }
};

const fix = async () => {
    await connectDB();
    const user = await User.findOne({ rollNumber: '1001' });
    console.log(`Before: '${user.batch}'`);

    user.batch = '1';
    const saved = await user.save();
    console.log(`Saved: '${saved.batch}'`);

    // Verify raw fetch
    const verify = await User.findOne({ rollNumber: '1001' });
    console.log(`After Fetch: '${verify.batch}'`);

    process.exit();
};

fix();
