import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/models/Complaint.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const patchComplaint = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB`);

        // Find and update "Stomachache" complaint
        const result = await Complaint.updateOne(
            { title: { $regex: 'STOMACHACHE', $options: 'i' } },
            { $set: { category: 'Personal' } }
        );

        if (result.matchedCount > 0) {
            console.log(`Successfully patched ${result.modifiedCount} complaint(s) to 'Personal'.`);
        } else {
            console.log('Complaint not found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

patchComplaint();
