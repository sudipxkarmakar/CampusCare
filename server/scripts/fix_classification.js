import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Complaint from '../src/models/Complaint.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find the specific complaint
        const complaint = await Complaint.findOne({
            title: { $regex: /hand is not working/i }
        });

        if (complaint) {
            console.log(`Found Complaint: "${complaint.title}"`);
            console.log(`Current Category: ${complaint.category}`);

            // Update to Personal
            complaint.category = 'Personal';
            complaint.priority = 'Urgent'; // As established in heuristic
            await complaint.save();

            console.log(`✅ UPDATED to Category: ${complaint.category}`);
        } else {
            console.log('❌ Complaint not found!');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fixData();
