import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';
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

const checkNotices = async () => {
    await connectDB();
    try {
        const notices = await Notice.find({});
        console.log(`Found ${notices.length} notices.`);
        notices.forEach(n => {
            console.log(`- [${n.audience}] ${n.title} (By: ${n.postedBy})`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

checkNotices();
