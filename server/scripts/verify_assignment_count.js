
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

const verifyCounts = async () => {
    try {
        await connectDB();
        console.log("Verifying Pending Assignments for Student 1001...");

        // 1. Get Student
        const student = await User.findOne({ rollNumber: '1001' });
        if (!student) {
            console.log("❌ Student 1001 not found.");
            process.exit(1);
        }

        console.log(`👤 Student: ${student.name} (${student.department} - ${student.year} Year - Batch ${student.batch})`);

        // 2. Count "Pending" Assignments
        // Logic: Targeted at student's Dept/Year/Batch AND Deadline > Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const query = {
            department: student.department,
            year: student.year,
            batch: { $in: [student.batch, 'All'] },
            deadline: { $gte: today } // Assuming pending means "not expired"
        };

        const count = await Assignment.countDocuments(query);
        const assignments = await Assignment.find(query).select('title deadline subject');

        console.log(`\n📊 Count Logic: Dept=${query.department}, Year=${query.year}, Batch=${query.batch.$in}, Deadline >= Today`);
        console.log(`✅ Database Count: ${count}`);

        console.log("\n📋 List of Pending Assignments:");
        assignments.forEach(a => {
            console.log(`   - [${a.subject}] ${a.title} (Due: ${a.deadline.toISOString().split('T')[0]})`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verifyCounts();
