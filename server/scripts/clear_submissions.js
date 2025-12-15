
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Submission from '../src/models/Submission.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

const clearSubmissions = async () => {
    await connectDB();
    try {
        // Option A: Delete ALL submissions (Easiest for testing)
        // Option B: Delete only for a specific assignment?
        // Let's delete ALL for now as we are dev-testing.
        const result = await Submission.deleteMany({});
        console.log(`Deleted ${result.deletedCount} submissions.`);
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

clearSubmissions();
