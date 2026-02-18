import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/models/Complaint.js';
import User from '../src/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyMyComplaints = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB`);

        // 1. Get a Student
        const student = await User.findOne({ role: 'student' });
        if (!student) throw new Error('No student found.');
        console.log(`Testing with Student: ${student.name} (${student._id})`);

        // 2. Ensure they have a Personal complaint
        let personalComplaint = await Complaint.findOne({ student: student._id, category: 'Personal' });
        if (!personalComplaint) {
            console.log('Creating test Personal complaint for student...');
            personalComplaint = await Complaint.create({
                title: 'My Personal Issue',
                description: 'Private matter',
                category: 'Personal',
                priority: 'Medium',
                student: student._id
            });
        }
        console.log(`Personal Complaint ID: ${personalComplaint._id}`);

        // 3. Simulate "My Complaints" Endpoint Logic
        const myComplaints = await Complaint.find({ student: student._id }).sort({ createdAt: -1 });

        // 4. Verify
        const found = myComplaints.some(c => c._id.equals(personalComplaint._id));
        if (found) {
            console.log('SUCCESS: Personal complaint found in "My Complaints" query.');
        } else {
            console.error('FAILURE: Personal complaint NOT found in "My Complaints" query.');
        }

        console.log(`\nTotal My Complaints: ${myComplaints.length}`);
        myComplaints.forEach(c => console.log(`- [${c.category}] ${c.title}`));

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

verifyMyComplaints();
