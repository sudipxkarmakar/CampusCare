import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const fixBatches = async () => {
    try {
        await connectDB();
        console.log("🛠️  Starting Batch Standardization Fix...");

        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} students.`);

        let updatedCount = 0;

        for (const student of students) {
            let needsUpdate = false;
            let newBatch = student.batch;
            let newSubBatch = student.subBatch;

            // 1. Standardize Batch
            if (['1', 'A'].includes(student.batch)) {
                newBatch = 'Batch 1';
                needsUpdate = true;
            } else if (['2', 'B'].includes(student.batch)) {
                newBatch = 'Batch 2';
                needsUpdate = true;
            } else if (!student.batch || student.batch === '') {
                // Infer from Roll Number if needed? Or default to Batch 1?
                // Let's leave blank/unchanged if unknown, or default to Batch 1 if user requested strict sync
            }

            // 2. Standardize SubBatch
            const sb = student.subBatch;
            if (['1-1', 'A1', '1'].includes(sb)) {
                newSubBatch = 'Batch 11';
                needsUpdate = true;
            } else if (['1-2', 'A2', '2'].includes(sb)) {
                newSubBatch = 'Batch 12';
                needsUpdate = true;
            } else if (['2-1', 'B1', '3'].includes(sb)) {
                newSubBatch = 'Batch 21';
                needsUpdate = true;
            } else if (['2-2', 'B2', '4'].includes(sb)) {
                newSubBatch = 'Batch 22';
                needsUpdate = true;
            } else if (!sb && newBatch === 'Batch 1') {
                // Fallback: If Batch 1 but no sub-batch, assign Batch 11
                newSubBatch = 'Batch 11';
                needsUpdate = true;
            } else if (!sb && newBatch === 'Batch 2') {
                newSubBatch = 'Batch 21';
                needsUpdate = true;
            }

            if (needsUpdate) {
                student.batch = newBatch;
                student.subBatch = newSubBatch;
                await student.save();
                updatedCount++;
            }
        }

        console.log(`✅ Updated ${updatedCount} students.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Fix failed:", error);
        process.exit(1);
    }
};

fixBatches();
