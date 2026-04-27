import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/models/Complaint.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspectStomachache = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB`);

        // Find the specific complaint from the user's screenshot
        const stomachache = await Complaint.findOne({ title: { $regex: 'STOMACHACHE', $options: 'i' } });

        if (stomachache) {
            console.log('--- FOUND COMPLAINT ---');
            console.log(`Title: ${stomachache.title}`);
            console.log(`Category: ${stomachache.category}`);
            console.log(`Status: ${stomachache.status}`);
            console.log('-----------------------');
        } else {
            console.log('Complaint with title containing "STOMACHACHE" not found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

inspectStomachache();
