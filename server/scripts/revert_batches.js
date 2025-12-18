import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const revertBatches = async () => {
    try {
        await connectDB();
        console.log("↩️  Reverting Batch Names...");

        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} students.`);

        let updatedCount = 0;

        for (const student of students) {
            let needsUpdate = false;
            let newBatch = student.batch;
            let newSubBatch = student.subBatch;

            // 1. Revert Batch: "Batch 1" -> "1"
            if (student.batch === 'Batch 1') {
                newBatch = '1';
                needsUpdate = true;
            } else if (student.batch === 'Batch 2') {
                newBatch = '2';
                needsUpdate = true;
            }

            // 2. Revert SubBatch: "Batch 11" -> "1-1"
            const sb = student.subBatch;
            if (sb === 'Batch 11') {
                newSubBatch = '1-1';
                needsUpdate = true;
            } else if (sb === 'Batch 12') {
                newSubBatch = '1-2';
                needsUpdate = true;
            } else if (sb === 'Batch 21') {
                newSubBatch = '2-1';
                needsUpdate = true;
            } else if (sb === 'Batch 22') {
                newSubBatch = '2-2';
                needsUpdate = true;
            }

            if (needsUpdate) {
                student.batch = newBatch;
                student.subBatch = newSubBatch;
                await student.save();
                updatedCount++;
            }
        }

        console.log(`✅ Reverted ${updatedCount} students.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Revert failed:", error);
        process.exit(1);
    }
};

revertBatches();
