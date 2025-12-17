
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Assignment from '../src/models/Assignment.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkDuplicates = async () => {
    try {
        await connectDB();

        const count = await Assignment.countDocuments();
        console.log(`Total Assignments/Notes: ${count}`);

        const assignments = await Assignment.find({}, 'title department year type');

        // Group by title to find duplicates
        const titleCounts = {};
        assignments.forEach(a => {
            const key = `[${a.department}-${a.year}] ${a.title}`;
            titleCounts[key] = (titleCounts[key] || 0) + 1;
        });

        console.log("\n--- Potential Duplicates ---");
        let hasHardUserDuplicates = false;
        for (const [key, val] of Object.entries(titleCounts)) {
            if (val > 1) {
                console.log(`${key}: ${val} copies`);
                hasHardUserDuplicates = true;
            }
        }

        if (!hasHardUserDuplicates) {
            console.log("No exact title/dept/year duplicates found.");
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkDuplicates();
