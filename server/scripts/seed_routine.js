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

const seedRoutine = async () => {
    try {
        await connectDB();
        console.log("🚀 Seeding Phase 4 Routine Data...");

        // 1. Get Resources
        // We know we have teacher1 (CSE) and CS201 (Data Structures) from Phase 3 simulation
        const teacher = await User.findOne({ name: "Teacher 1" });
        const subject = await Subject.findOne({ code: "CS201" });

        if (!teacher || !subject) {
            console.error("❌ Pre-requisites missing. Run Phase 3 simulation first.");
            process.exit(1);
        }

        // 2. Define Entries (CSE 2nd Year, Batch 1)
        const entries = [
            {
                department: "CSE",
                year: "2nd Year",
                batch: "1",
                day: "Monday",
                timeSlot: "10:00 - 11:00",
                period: 1,
                subject: subject._id,
                teacher: teacher._id,
                room: "LH-101"
            },
            {
                department: "CSE",
                year: "2nd Year",
                batch: "1",
                day: "Monday",
                timeSlot: "11:00 - 12:00",
                period: 2,
                subject: subject._id,
                teacher: teacher._id,
                room: "LH-101"
            },
            {
                department: "CSE",
                year: "2nd Year",
                batch: "1",
                day: "Tuesday",
                timeSlot: "10:00 - 11:00",
                period: 1,
                subject: subject._id,
                teacher: teacher._id,
                room: "Lab-2"
            }
        ];

        await Routine.deleteMany({}); // Clear old prototype data
        await Routine.insertMany(entries);

        console.log(`✅ Seeded ${entries.length} routine entries.`);

        // 3. Verify Views
        console.log("\n--- VERIFYING VIEWS ---");

        // Student View (CSE / 2nd Year / Batch 1)
        const studentRoutine = await Routine.find({ department: "CSE", year: "2nd Year", batch: "1" });
        console.log(`Student View matches: ${studentRoutine.length} classes`);

        // Teacher View (Teacher 1)
        const teacherRoutine = await Routine.find({ teacher: teacher._id });
        console.log(`Teacher View matches: ${teacherRoutine.length} classes`);

        process.exit(0);

    } catch (e) {
        console.error("❌ Routine Seeding Failed:", e);
        process.exit(1);
    }
};

seedRoutine();
