
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import MarMooc from '../src/models/MarMooc.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyMarMoocStats = async () => {
    try {
        await connectDB();

        console.log("--- Verifying MAR/MOOC Stats ---");

        const student = await User.findOne({ rollNumber: '1001' });
        if (!student) throw new Error("Student 1001 not found");

        const records = await MarMooc.find({ student: student._id });

        const marPoints = records
            .filter(r => r.category === 'mar')
            .reduce((acc, curr) => acc + (curr.points || 0), 0);

        const moocCredits = records
            .filter(r => r.category === 'mooc')
            .reduce((acc, curr) => acc + (curr.points || 0), 0);

        console.log(`Student: ${student.name}`);
        console.log(`MAR Points: ${marPoints} (Expected: 42)`);
        console.log(`MOOC Credits: ${moocCredits} (Expected: 12)`);
        console.log(`Total Records: ${records.length} (Expected: 8)`);

        if (records.length > 0) {
            console.log("Sample Record:", JSON.stringify(records[0], null, 2));
        }

        if (marPoints === 42 && moocCredits === 12) {
            console.log("✅ Verification Passed: Stats match expected values.");
            process.exit(0);
        } else {
            console.log("❌ Verification Failed: Stats mismatch.");
            process.exit(1);
        }

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verifyMarMoocStats();
