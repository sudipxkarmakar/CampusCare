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

const SUBJECT_NAMES = {
    'CSE': ['Data Structures', 'Algorithms', 'DBMS', 'OS', 'Networks', 'AI', 'Compiler Design', 'Web Dev'],
    'IT': ['Info Security', 'Java', 'Python', 'Cloud Computing', 'Software Engg', 'Ecommerce', 'Data Mining'],
    'ECE': ['Signals & Systems', 'Analog Circuits', 'Digital Electronics', 'Control Systems', 'Microprocessors', 'VLSI'],
    // Simplified for others
    'ME': ['Thermodynamics', 'Fluid Mechanics', 'SOM', 'TOM'],
    'CIVIL': ['Structure Analysis', 'Geotech', 'Surveying', 'Concrete Tech'],
    'AIML': ['Machine Learning', 'Deep Learning', 'NLP', 'Robotics']
};

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const seedAcademic = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");
        await connectDB();

        console.log("🧹 Clearing Academic Data (Subjects/Routines)...");
        await Subject.deleteMany({});
        await Routine.deleteMany({});

        console.log("🌱 Seeding Subjects...");

        // Fetch Teachers map by Dept
        // We need to assign each subject a "Coordinator" (Teacher from that Dept)
        const teachersByDept = {};
        const depts = Object.keys(SUBJECT_NAMES);

        for (const dept of depts) {
            teachersByDept[dept] = await User.find({ role: 'teacher', department: dept });
        }

        const subjects = [];

        for (const dept of depts) {
            const deptTeachers = teachersByDept[dept];
            if (!deptTeachers || deptTeachers.length === 0) {
                console.warn(`Warning: No teachers for ${dept}, skipping subjects.`);
                continue;
            }

            const deptSubjects = SUBJECT_NAMES[dept];

            // Distribute subjects across years roughly
            let subIdx = 0;
            for (const year of YEARS) {
                // Assign 2 subjects per year per dept for demo
                for (let k = 0; k < 2; k++) {
                    if (subIdx >= deptSubjects.length) break;

                    const subName = deptSubjects[subIdx++];
                    const teacher = deptTeachers[subIdx % deptTeachers.length]; // Round robin assignment

                    const subject = await Subject.create({
                        name: subName,
                        code: `${dept}-${year.substring(0, 1)}0${k + 1}`,
                        department: dept,
                        year: year,
                        teacher: teacher._id
                    });
                    subjects.push(subject);
                }
            }
        }
        console.log(`✅ Created ${subjects.length} Subjects.`);

        console.log("📅 Seeding Routines (Conflict Free)...");
        // Simple Routine Strategy:
        // For each Dept + Year + Batch:
        // Schedule 3 periods a day (Mon-Fri)
        // Ensure Teacher is free.

        // Conflict Tracker: `TeacherID-Day-Slot` -> true
        const scheduleMap = new Set();
        const routines = [];
        const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const SLOTS = ['10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00'];

        // We iterate Subjects (which have Dept/Year properties)
        // Check if we can schedule them for Batch 1 and Batch 2

        for (const sub of subjects) {
            // Schedule this subject twice a week for Batch 1 and Batch 2
            let scheduledCount = 0;

            // Try to find slots
            for (const day of DAYS) {
                if (scheduledCount >= 2) break;
                for (const slot of SLOTS) {
                    if (scheduledCount >= 2) break;

                    const teacherId = sub.teacher.toString();
                    const key = `${teacherId}-${day}-${slot}`;

                    if (!scheduleMap.has(key)) {
                        // Free! Book it for Batch 1
                        scheduleMap.add(key);

                        routines.push({
                            day,
                            timeSlot: slot,
                            year: sub.year,
                            department: sub.department,
                            batch: '1', // Defaulting to Batch 1 for demo
                            subject: sub._id,
                            subjectName: sub.name,
                            teacher: sub.teacher,
                            room: `Room-${sub.department.substring(0, 2)}-${Math.floor(Math.random() * 10)}`
                        });
                        scheduledCount++;
                    }
                }
            }
        }

        await Routine.insertMany(routines);
        console.log(`✅ Created ${routines.length} Routine Entries.`);
        console.log("✅ Academic Seeding Complete.");
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedAcademic();
