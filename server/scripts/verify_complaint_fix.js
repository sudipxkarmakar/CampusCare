import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/models/Complaint.js';
import User from '../src/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyFix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB`);

        // Find a student to assign the complaint to
        const student = await User.findOne({ role: 'student' });
        if (!student) {
            console.log('No student found to create complaint against. Skipping.');
            process.exit(0);
        }

        const complaintData = {
            title: 'Test Personal Issue',
            description: 'I am feeling very lonely and depressed today.',
            category: 'Personal', // This was failing before
            priority: 'High',
            status: 'Submitted',
            student: student._id
        };

        console.log('Attempting to create complaint with category: Personal');
        const complaint = await Complaint.create(complaintData);
        console.log('Complaint created successfully:', complaint);
        console.log('VERIFICATION SUCCESS: Category "Personal" is accepted.');

        // Cleanup
        await Complaint.findByIdAndDelete(complaint._id);
        console.log('Test complaint deleted.');

        process.exit(0);
    } catch (error) {
        console.error('VERIFICATION FAILED:', error.message);
        process.exit(1);
    }
};

verifyFix();
