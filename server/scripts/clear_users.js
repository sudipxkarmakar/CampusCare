import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const clearData = async () => {
    try {
        await connectDB();

        console.log('⚠️  Starting deletion of Students and Teachers...');

        const result = await User.deleteMany({
            role: { $in: ['student', 'teacher'] }
        });

        console.log(`✅ Successfully deleted ${result.deletedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    }
};

clearData();
