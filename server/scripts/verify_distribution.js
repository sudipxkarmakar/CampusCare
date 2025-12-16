import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyDistribution = async () => {
    try {
        await connectDB();

        console.log('--- DEPARTMENT COUNTS (Target: 400) ---');
        const depts = ['CSE', 'IT', 'AIML'];
        for (const d of depts) {
            const count = await User.countDocuments({
                role: { $in: ['student', 'hosteler'] },
                department: d
            });
            console.log(`${d}: ${count}`);
        }

        console.log('\n--- BATCH STRUCTURE SAMPLE (CSE) ---');
        // Check CSE Structure
        const cse2026 = await User.countDocuments({ department: 'CSE', passOutYear: '2026' });
        console.log(`CSE 2026 (Target 100): ${cse2026}`);

        const batch1 = await User.countDocuments({ department: 'CSE', passOutYear: '2026', batch: '1' });
        console.log(`  Batch 1 (Target 50): ${batch1}`);

        const subBatch1_1 = await User.countDocuments({ department: 'CSE', passOutYear: '2026', subBatch: '1-1' });
        console.log(`    Sub-batch 1-1 (Target 25): ${subBatch1_1}`);

        console.log('\n--- INDIVIDUAL SAMPLES ---');
        const s1 = await User.findOne({ rollNumber: "1" });     // Expect CSE, 2026, 1-1
        const s401 = await User.findOne({ rollNumber: "401" }); // Expect IT, 2026, 1-1

        console.log(`Roll 1: ${s1.department} | ${s1.passOutYear} | ${s1.subBatch}`);
        console.log(`Roll 401: ${s401.department} | ${s401.passOutYear} | ${s401.subBatch}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
verifyDistribution();
