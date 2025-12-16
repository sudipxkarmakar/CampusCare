import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const simulateHOD = async () => {
    try {
        await connectDB();
        console.log("🚀 Simulating HOD Control Panel Actions...");

        // 1. Identify HOD CSE
        const hod = await User.findOne({ role: 'hod', department: 'CSE' });
        console.log(`\n👨‍🏫 HOD Logged In: ${hod.name} (${hod.department})`);

        // 2. View Department Stats
        const studentCount = await User.countDocuments({ role: 'student', department: 'CSE' });
        const teacherCount = await User.countDocuments({ role: 'teacher', department: 'CSE' });
        console.log(`📊 Dashboard Stats: ${studentCount} Students, ${teacherCount} Teachers`);

        // 3. Define Subjects (if not exists)
        const subjects = [
            { name: "Data Structures", code: "CS201", year: "2nd Year", department: "CSE" },
            { name: "Algorithms", code: "CS202", year: "2nd Year", department: "CSE" },
            { name: "Database Systems", code: "CS301", year: "3rd Year", department: "CSE" }
        ];

        for (const sub of subjects) {
            const exists = await Subject.findOne({ code: sub.code });
            if (!exists) {
                await Subject.create(sub);
                console.log(`✅ Created Subject: ${sub.name}`);
            }
        }

        // 4. Assign Teacher to Subject
        const teacher = await User.findOne({ role: 'teacher', department: 'CSE' }); // Pick first teacher
        const dsa = await Subject.findOne({ code: "CS201" });

        if (teacher && dsa) {
            if (!dsa.teachers.includes(teacher._id)) {
                dsa.teachers.push(teacher._id);
                await dsa.save();

                // Update Teacher Profile
                await User.findByIdAndUpdate(teacher._id, { $addToSet: { teachingSubjects: dsa.name } });
                console.log(`🔗 Assigned ${teacher.name} to Subject: ${dsa.name}`);
            } else {
                console.log(`ℹ️  ${teacher.name} already assigned to ${dsa.name}`);
            }
        }

        // 5. Assign Teacher to Batch (Mentorship or Class Teacher)
        if (teacher) {
            await User.findByIdAndUpdate(teacher._id, { $addToSet: { teachingBatches: "2nd Year" } });
            console.log(`🔗 Assigned ${teacher.name} to Batch: 2nd Year`);
        }

        // 6. Assign Mentor to Sub-batch (e.g., 1-1)
        const subBatch = "1-1";
        // Find students in this sub-batch
        const mentees = await User.find({ department: 'CSE', subBatch: subBatch });

        if (mentees.length > 0 && teacher) {
            await User.updateMany(
                { department: 'CSE', subBatch: subBatch },
                { $set: { mentor: teacher._id } }
            );

            // Update Mentor's list
            const menteeIds = mentees.map(m => m._id);
            await User.findByIdAndUpdate(teacher._id, { $addToSet: { menteesSubBatches: subBatch } });

            console.log(`🔗 Assigned ${teacher.name} as Mentor for Sub-batch ${subBatch} (${mentees.length} students)`);
        }

        console.log("\n✅ HOD Simulation Complete. All actions successful.");
        process.exit(0);

    } catch (e) {
        console.error("❌ Simulation Failed:", e);
        process.exit(1);
    }
};

simulateHOD();
