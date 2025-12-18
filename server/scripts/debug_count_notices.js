
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
    } catch (err) {
        process.exit(1);
    }
};

const countNotices = async () => {
    await connectDB();
    const general = await Notice.countDocuments({ audience: 'general' });
    const student = await Notice.countDocuments({ audience: 'student' });
    const teacher = await Notice.countDocuments({ audience: 'teacher' });
    const hosteler = await Notice.countDocuments({ audience: 'hosteler' });

    console.log(JSON.stringify({ general, student, teacher, hosteler }));
    mongoose.connection.close();
    process.exit();
};

countNotices();
