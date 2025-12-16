import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyLogic = async () => {
    try {
        await connectDB();
        console.log("🚀 Verifying Phase 6 Rules...");

        // 1. Check Subject Count (Expected 48 total, 16 per dept)
        const subCount = await Subject.countDocuments();
        console.log(`Total Subjects: ${subCount} (Target: 48 + 3 prototypes = 51 approx)`);

        const cseSubs = await Subject.countDocuments({ department: 'CSE' });
        console.log(`CSE Subjects: ${cseSubs}`);

        // 2. Check Teacher Load (Teacher 1)
        const teacher = await User.findOne({ role: 'teacher', department: 'CSE' }); // Likely teacher1@...
        console.log(`\n👨‍🏫 Teacher Check: ${teacher.name}`);
        console.log(`   Teaching Subjects: ${teacher.teachingSubjects.length} (Target: 2)`);
        console.log(`   Batches Assigned: ${teacher.teachingBatches.length} (Target: 2+ strings)`); // "2029 (All)" counts as main entry
        console.log(`   Mentoring Groups: ${teacher.menteesSubBatches.join(', ')} (Target: 2 groups)`);

        // 3. Mentee Linkage
        const mentees = await User.countDocuments({ mentor: teacher._id });
        console.log(`   Linked Mentees: ${mentees} (Target: ~50)`);

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verifyLogic();
