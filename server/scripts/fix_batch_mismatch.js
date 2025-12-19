
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
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const fixBatch = async () => {
    await connectDB();

    // Find the user Sudip (Roll 1001)
    const user = await User.findOne({ rollNumber: '1001' });
    if (!user) {
        console.log('User Sudip (1001) not found!');
        process.exit();
    }

    console.log(`Current Batch: ${user.batch}`);

    if (user.batch === 'Batch 1') {
        user.batch = '1';
        await user.save();
        console.log('Updated Batch to "1"');
    } else {
        console.log('Batch is already correct or different format.');
    }

    process.exit();
};

fixBatch();
