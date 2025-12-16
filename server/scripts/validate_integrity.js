import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';
import Routine from '../src/models/Routine.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const validate = async () => {
    try {
        if (!process.env.MONGO_URI) { console.error("❌ MONGO_URI missing"); process.exit(1); }
        await connectDB();
        console.log("🚀 Running Constraints & Checks...");

        // 1. No student without batch
        const studentsNoBatch = await User.countDocuments({ role: 'student', batch: { $exists: false } });
        if (studentsNoBatch > 0) console.error(`❌ FAILURE: ${studentsNoBatch} students have no batch.`);
        else console.log("✅ CHECK PASS: All students have a batch.");

        // 2. No sub-batch without mentor
        // Constraint: If a student has a subBatch, they must have a mentor.
        const studentsNoMentor = await User.countDocuments({
            role: 'student',
            subBatch: { $exists: true, $ne: null },
            mentor: { $exists: false }
        });
        if (studentsNoMentor > 0) console.error(`❌ FAILURE: ${studentsNoMentor} students in sub-batch have no mentor.`);
        else console.log("✅ CHECK PASS: All sub-batch students have a mentor.");

        // 3. No subject without teacher
        // Find subjects where teacher field is missing
        const subjectNoTeacher = await Subject.countDocuments({ teacher: { $exists: false } });
        if (subjectNoTeacher > 0) console.error(`❌ FAILURE: ${subjectNoTeacher} subjects have no teacher.`);
        else console.log("✅ CHECK PASS: All subjects have a teacher.");

        // 4. No Routine Conflict
        // Check for duplicate Teacher time slots
        const routines = await Routine.find({});
        const teacherSchedule = new Set();
        let conflictCount = 0;

        for (const r of routines) {
            const key = `${r.teacher}-${r.day}-${r.timeSlot}`;
            if (teacherSchedule.has(key)) {
                console.error(`❌ CONFLICT: Teacher ${r.teacher} has overlap on ${r.day} ${r.timeSlot}`);
                conflictCount++;
            }
            teacherSchedule.add(key);
        }

        if (conflictCount > 0) console.error(`❌ FAILURE: Found ${conflictCount} routine conflicts.`);
        else console.log("✅ CHECK PASS: No routine conflicts found.");

        console.log("🏁 Validation Logic Complete.");

        if (studentsNoBatch === 0 && studentsNoMentor === 0 && subjectNoTeacher === 0 && conflictCount === 0) {
            console.log("✨ ALL SYSTEMS VALID");
            process.exit(0);
        } else {
            process.exit(1);
        }

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

validate();
