import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/models/Complaint.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyContent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB`);

        // 1. Check Specific Complaint
        const stomachache = await Complaint.findOne({ title: { $regex: 'STOMACHACHE', $options: 'i' } });
        console.log('--- COMPLAINT DETAILS ---');
        console.log(`Title: ${stomachache?.title}`);
        console.log(`Category: ${stomachache?.category} (Should be 'Personal')`);
        console.log('-------------------------');

        // 2. Simulate Wall Query
        const wallComplaints = await Complaint.find({ category: { $ne: 'Personal' } });
        const onWall = wallComplaints.find(c => c._id.equals(stomachache._id));

        if (onWall) {
            console.error('FAILURE: The complaint IS appearing in the Wall Query results!');
            console.error('Possible reason: Category is not "Personal" or Query is wrong.');
        } else {
            console.log('SUCCESS: The complaint is NOT in the Wall Query results.');
            console.log('If user still sees it, the SERVER PROCESS IS STALE and needs restart.');
        }

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

verifyContent();
