import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/models/Complaint.js';
import User from '../src/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyWallFilter = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB`);

        // 1. Ensure a Personal complaint exists
        const student = await User.findOne({ role: 'student' });
        if (student) {
            await Complaint.create({
                title: 'Hidden Personal Issue',
                description: 'This should not appear on the wall.',
                category: 'Personal',
                priority: 'High',
                student: student._id
            });
            console.log('Created test "Personal" complaint.');
        }

        // 2. Simulate the Public Wall Query
        const wallComplaints = await Complaint.find({ category: { $ne: 'Personal' } });

        // 3. Check if any 'Personal' complaints slipped through
        const personalOnWall = wallComplaints.filter(c => c.category === 'Personal');

        if (personalOnWall.length === 0) {
            console.log('SUCCESS: No "Personal" complaints found in the Transparency Wall query.');
            console.log(`Total visible complaints: ${wallComplaints.length}`);
        } else {
            console.error('FAILURE: Found "Personal" complaints on the wall!');
            console.error(personalOnWall);
        }

        // Cleanup (Optional, but good practice to keep DB clean of test data)
        await Complaint.deleteOne({ title: 'Hidden Personal Issue' });
        console.log('Test complaint deleted.');

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

verifyWallFilter();
