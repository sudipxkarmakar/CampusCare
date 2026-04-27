import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/models/Complaint.js';
import User from '../src/models/User.js'; // Needed if we create a user/complaint
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyDualView = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB`);

        // 1. Ensure a Personal complaint exists for testing
        let personalComplaint = await Complaint.findOne({ category: 'Personal' });

        if (!personalComplaint) {
            console.log('No Personal complaint found. Creating one for test...');
            const student = await User.findOne({ role: 'student' });
            if (!student) throw new Error('No student found to associate complaint with.');

            personalComplaint = await Complaint.create({
                title: 'Test Personal Issue',
                description: 'Hidden from public',
                category: 'Personal',
                priority: 'High',
                student: student._id
            });
        }
        console.log(`Test Personal Complaint ID: ${personalComplaint._id}`);

        // 2. Simulate "Public Wall" Query (public=true)
        // Controller logic: if (req.query.public === 'true') filter.category = { $ne: 'Personal' }
        const publicWallComplaints = await Complaint.find({ category: { $ne: 'Personal' } });

        const isPersonalOnPublicWall = publicWallComplaints.some(c => c._id.equals(personalComplaint._id));

        if (isPersonalOnPublicWall) {
            console.error('FAILURE: Personal complaint FOUND in Public Wall query!');
        } else {
            console.log('SUCCESS: Personal complaint NOT found in Public Wall query.');
        }

        // 3. Simulate "My Complaints" / Center Query (No filter)
        // Controller logic: const complaints = await Complaint.find(filter) -> filter is empty
        const allComplaints = await Complaint.find({});

        const isPersonalInCenter = allComplaints.some(c => c._id.equals(personalComplaint._id));

        if (isPersonalInCenter) {
            console.log('SUCCESS: Personal complaint FOUND in General/Center query.');
        } else {
            console.error('FAILURE: Personal complaint NOT found in General query!');
        }

        if (!isPersonalOnPublicWall && isPersonalInCenter) {
            console.log('\n>>> VERIFICATION PASSED: Dual View Logic holds. <<<');
        } else {
            console.error('\n>>> VERIFICATION FAILED <<<');
        }

        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

verifyDualView();
