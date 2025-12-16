import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const distributeStudents = async () => {
    try {
        await connectDB();
        console.log("🚀 Starting Phase 2 Distribution...");

        // Fetch all students/hostelers sorted by roll number (numerical sort if possible, but string sort 1, 10, 100... might mess up. 
        // Best to fetch and sort in JS to be safe since we allowed "1-1200" strings)
        let students = await User.find({ role: { $in: ['student', 'hosteler'] } });

        // Sort numerically by Roll Number
        students.sort((a, b) => parseInt(a.rollNumber) - parseInt(b.rollNumber));

        console.log(`Found ${students.length} students to distribute.`);

        const DEPARTMENTS = ['CSE', 'IT', 'AIML'];
        // 1200 / 3 = 400 per dept.

        const YEARS = ['2026', '2027', '2028', '2029'];
        // 400 / 4 = 100 per year. (2026=4th yr, 2029=1st yr roughly)

        const bulkOps = [];

        students.forEach((student, index) => {
            // 1. Department
            const deptIndex = Math.floor(index / 400); // 0, 1, 2
            const department = DEPARTMENTS[deptIndex];

            // Index within Department (0-399)
            const indexInDept = index % 400;

            // 2. Year (PassOutYear)
            const yearIndex = Math.floor(indexInDept / 100); // 0, 1, 2, 3
            const passOutYear = YEARS[yearIndex];

            // Derived Year String (e.g., "4th Year")
            const yearMapping = {
                '2026': '4th Year',
                '2027': '3rd Year',
                '2028': '2nd Year',
                '2029': '1st Year'
            };
            const year = yearMapping[passOutYear];

            // Index within Year (0-99)
            const indexInYear = indexInDept % 100;

            // 3. Batch (1 or 2) - 50 each
            // 0-49 -> Batch 1
            // 50-99 -> Batch 2
            const batchNum = Math.floor(indexInYear / 50) + 1;
            const batch = batchNum.toString();

            // Index within Batch (0-49)
            const indexInBatch = indexInYear % 50;

            // 4. Sub-Batch (1-1, 1-2, 2-1, 2-2)
            // Batch 1: 0-24 -> 1-1, 25-49 -> 1-2
            // Batch 2: 0-24 -> 2-1, 25-49 -> 2-2
            const subBatchSuffix = Math.floor(indexInBatch / 25) + 1; // 1 or 2
            const subBatch = `${batch}-${subBatchSuffix}`;

            // Push Update
            bulkOps.push({
                updateOne: {
                    filter: { _id: student._id },
                    update: {
                        $set: {
                            department: department,
                            passOutYear: passOutYear,
                            year: year,
                            batch: batch,
                            subBatch: subBatch
                        }
                    }
                }
            });
        });

        if (bulkOps.length > 0) {
            await User.bulkWrite(bulkOps);
            console.log(`✅ Successfully distributed ${bulkOps.length} students.`);
        }

        process.exit(0);

    } catch (error) {
        console.error("❌ Distribution failed:", error);
        process.exit(1);
    }
};

distributeStudents();
