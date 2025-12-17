
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

const checkRealism = async () => {
    try {
        await connectDB();

        console.log("--- Checking Assignment Diversity (Random Sample) ---");

        const assignments = await Assignment.find()
            .populate('teacher', 'name department')
            .limit(20);

        if (assignments.length === 0) {
            console.log("No assignments found.");
            process.exit(0);
        }

        assignments.forEach(a => {
            console.log(`[${a.department} - ${a.year}] ${a.subject} | Teacher: ${a.teacher ? a.teacher.name : 'Unknown'} | Title: ${a.title}`);
        });

        // Check Count of Distinct Teachers per Dept
        const assignmentsAll = await Assignment.find().populate('teacher', 'name department');
        const teacherCounts = {};
        const subjectCounts = {};

        assignmentsAll.forEach(a => {
            const tName = a.teacher ? a.teacher.name : 'Unknown';
            const dept = a.department;
            const key = `${dept} - ${tName}`;
            teacherCounts[key] = (teacherCounts[key] || 0) + 1;

            const subKey = `${dept} - ${a.subject}`;
            subjectCounts[subKey] = (subjectCounts[subKey] || 0) + 1;
        });

        console.log("\n--- Distribution Stats ---");
        console.log("Teachers used:", teacherCounts);
        console.log("Subjects used:", subjectCounts);

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkRealism();
