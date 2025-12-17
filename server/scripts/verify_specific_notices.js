
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Notice from '../src/models/Notice.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyNotices = async () => {
    try {
        await connectDB();
        console.log("--- Verifying Notices ---");

        const titles = [
            'CA Assignment Submission Deadline',
            'Library Overdue: Data Structures',
            'Winter Vacation Announcement'
        ];

        const found = await Notice.find({ title: { $in: titles } });

        if (found.length === titles.length) {
            console.log(`✅ All ${found.length}/${titles.length} requested notices found.`);
            found.forEach(n => console.log(`   - [${n.audience}] ${n.title}`));
        } else {
            console.log(`❌ Missing notices. Found: ${found.length}/${titles.length}`);
            console.log("Found:", found.map(n => n.title));
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verifyNotices();
