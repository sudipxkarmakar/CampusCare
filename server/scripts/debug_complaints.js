
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Complaint from '../src/models/Complaint.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

const debugComplaints = async () => {
    await connectDB();
    try {
        const complaints = await Complaint.find({});
        console.log("---- COMPLAINTS DUMP ----");
        complaints.forEach(c => {
            console.log(`Title: ${c.title}`);
            console.log(`Category: '${c.category}'`);
            console.log(`Priority: '${c.priority}'`);
            console.log(`Status: ${c.status}`);
            console.log("-----------------------");
        });
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

debugComplaints();
