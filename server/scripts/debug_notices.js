
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Notice from '../src/models/Notice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugNotices = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const notices = await Notice.find({ audience: 'student' }).sort({ date: -1 });
        console.log(`Found ${notices.length} STUDENT notices.`);

        notices.forEach(n => {
            console.log(`- Title: "${n.title}"`);
            console.log(`  Audience: '${n.audience}'`);
            console.log(`  TargetDept: '${n.targetDept}'`);
            console.log(`  PostedBy: ${n.postedBy}`);
            console.log('---');
        });

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugNotices();
