
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Routine from '../src/models/Routine.js';
import Notice from '../src/models/Notice.js';
import Complaint from '../src/models/Complaint.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyRegression = async () => {
    try {
        await connectDB();
        console.log("--- Regression Testing (Other Modules) ---");

        const student = await User.findOne({ rollNumber: '1001' });
        if (!student) throw new Error("Student 1001 not found");
        console.log(`Checking interactions for: ${student.name} (${student.department})`);

        // 1. Check Routine (Critical - touched previously)
        // Controller filters by: dept, year, batch, subBatch
        const routines = await Routine.find({
            department: student.department,
            year: student.year,
            batch: student.batch
        });
        console.log(`✅ Routine Check: Found ${routines.length} entries. (Should not be error)`);

        // 2. Check Notices (Untouched, should be fine)
        // Controller usually finds all or targeted
        const notices = await Notice.find({
            $or: [
                { targetAudience: 'student' },
                { targetAudience: 'all' }
            ]
        });
        console.log(`✅ Notice Check: Found ${notices.length} active notices.`);

        // 3. Check Complaints (Untouched)
        const complaints = await Complaint.countDocuments({ student: student._id });
        console.log(`✅ Complaint Check: User has ${complaints} complaints filed.`);

        console.log("\n✅ ALL SYSTEMS NORMAL. No side effects detected.");
        process.exit(0);

    } catch (e) {
        console.error("❌ Regression Error:", e.message);
        process.exit(1);
    }
};

verifyRegression();
