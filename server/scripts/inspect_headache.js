import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/models/Complaint.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspectHeadache = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB`);

        // Find the specific complaint
        const complaint = await Complaint.findOne({ title: { $regex: 'Headache', $options: 'i' } });

        if (complaint) {
            console.log('--- FOUND COMPLAINT ---');
            console.log(`Title: ${complaint.title}`);
            console.log(`Category: '${complaint.category}'`);
            console.log(`Status: ${complaint.status}`);
            console.log(`Created At: ${complaint.createdAt}`);
            console.log('-----------------------');

            if (complaint.category !== 'Personal') {
                console.log('ISSUE DETECTED: Category is NOT "Personal". This explains visibility.');
            } else {
                console.log('CATEGORY IS CORRECT ("Personal"). If visible, Backend Filter or Frontend Fetch is wrong.');
            }

        } else {
            console.log('Complaint with title containing "Headache" not found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

inspectHeadache();
