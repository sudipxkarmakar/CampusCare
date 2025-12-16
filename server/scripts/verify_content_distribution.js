import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Assignment from '../src/models/Assignment.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyContentDistribution = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is missing!");
            process.exit(1);
        }
        await connectDB();
        console.log("🚀 Verifying Content Distribution Logic...");

        // 1. Find a Teacher
        const teacher = await User.findOne({ role: 'Teacher' });
        if (!teacher) {
            console.error("❌ No teacher found in DB!");
            process.exit(1);
        }
        console.log(`👨‍🏫 Teacher Found: ${teacher.name} (${teacher._id})`);

        console.log(`👨‍🏫 Teacher: ${teacher.name}`);

        // 2. Create Assignments
        // A. General Batch 1 Assignment
        await Assignment.deleteMany({ title: /VERIFY_TEST/ }); // Cleanup

        const batchAssign = await Assignment.create({
            title: "VERIFY_TEST_BATCH_1",
            description: "For all of Batch 1",
            subject: "Test Subject",
            teacher: teacher._id,
            department: 'CSE',
            year: '2nd Year',
            batch: '1',
            deadline: new Date()
        });

        // B. Specific SubBatch 1-1 Assignment
        const subBatchAssign = await Assignment.create({
            title: "VERIFY_TEST_SUB_1_1",
            description: "For 1-1 Only",
            subject: "Test Subject",
            teacher: teacher._id,
            department: 'CSE',
            year: '2nd Year',
            batch: '1',
            subBatch: '1-1',
            deadline: new Date()
        });

        console.log("\n✅ Created Test Assignments for Batch 1 and SubBatch 1-1.");

        // 3. Simulate Student from 1-1
        // We need a student who is Dept CSE, 2nd Year, Batch 1, SubBatch 1-1
        // I'll just clear mocks if needed or find one.
        // Let's rely on query logic directly to test the query *logic* used in controller.

        const fetchContentForStudent = async (dept, year, batch, subBatch) => {
            return await Assignment.find({
                department: dept,
                year: year,
                $or: [
                    { batch: batch, subBatch: { $exists: false } },
                    { batch: batch, subBatch: null },
                    { batch: batch, subBatch: subBatch }
                ]
            });
        };

        // Test Student A (1-1)
        const assignmentsA = await fetchContentForStudent('CSE', '2nd Year', '1', '1-1');
        const titlesA = assignmentsA.map(a => a.title);
        console.log(`\n👨‍🎓 Student A (1-1) sees: ${titlesA.join(', ')}`);

        if (titlesA.includes("VERIFY_TEST_BATCH_1") && titlesA.includes("VERIFY_TEST_SUB_1_1")) {
            console.log("✅ Student A correctly sees both Batch and SubBatch content.");
        } else {
            console.error("❌ Student A missing content.");
        }

        // Test Student B (1-2)
        const assignmentsB = await fetchContentForStudent('CSE', '2nd Year', '1', '1-2');
        const titlesB = assignmentsB.map(a => a.title);
        console.log(`👨‍🎓 Student B (1-2) sees: ${titlesB.join(', ')}`);

        if (titlesB.includes("VERIFY_TEST_BATCH_1") && !titlesB.includes("VERIFY_TEST_SUB_1_1")) {
            console.log("✅ Student B sees Batch content but NOT 1-1 content.");
        } else {
            console.error("❌ Student B sees wrong content.");
        }

        // Cleanup
        await Assignment.deleteMany({ title: /VERIFY_TEST/ });
        console.log("\n✅ Cleanup executed. Verification Complete.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verifyContentDistribution();
