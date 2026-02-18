import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/models/Complaint.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspectComplaints = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB`);

        // Fetch all complaints to see what is currently stored
        const complaints = await Complaint.find().sort({ createdAt: -1 });

        console.log('--- CURRENT COMPLAINTS IN DB ---');
        complaints.forEach(c => {
            console.log(`Title: "${c.title}" | Category: [${c.category}] | Status: ${c.status}`);
        });
        console.log('--------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

inspectComplaints();
