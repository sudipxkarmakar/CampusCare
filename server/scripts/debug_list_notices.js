
import mongoose from 'mongoose';
import Notice from '../src/models/Notice.js';
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
    } catch (err) {
        console.error('Connection Error:', err.message);
        process.exit(1);
    }
};

const listNotices = async () => {
    await connectDB();

    try {
        const notices = await Notice.find({}).sort({ createdAt: -1 });
        console.log(`Found ${notices.length} notices.`);
        notices.forEach(n => {
            console.log(`[${n._id}] Title: "${n.title}" | Audience: ${n.audience} | Dept: ${n.targetDept || 'N/A'}`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

listNotices();
