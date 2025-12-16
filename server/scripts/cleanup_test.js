import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanup = async () => {
    try {
        await connectDB();
        await User.deleteOne({ email: "test.student@example.com" });
        console.log("✅ Cleanup complete.");
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
};
cleanup();
