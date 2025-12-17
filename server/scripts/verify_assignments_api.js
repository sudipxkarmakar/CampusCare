
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Assignment from '../src/models/Assignment.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyAssignments = async () => {
    try {
        await connectDB();

        // Mock Student 1001
        const student = await User.findOne({ rollNumber: '1001' });
        if (!student) {
            console.log("Student 1001 not found.");
            process.exit(1);
        }

        console.log(`Checking assignments for: ${student.name} (${student.department} - ${student.year} - Batch ${student.batch})`);

        const filter = {
            department: student.department,
            year: student.year,
            batch: student.batch
        };

        // Simulate Controller Logic (excluding section for now as seeded data doesn't have it)
        const assignments = await Assignment.find(filter);

        console.log(`Found ${assignments.length} items.`);
        assignments.forEach(a => {
            console.log(`- [${a.type.toUpperCase()}] ${a.title} (Due: ${a.deadline ? a.deadline.toISOString().split('T')[0] : 'None'})`);
        });

        if (assignments.length > 0) {
            console.log("✅ Verification SUCCESS");
        } else {
            console.log("❌ No assignments found. Check seeding/filtering match.");
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verifyAssignments();
