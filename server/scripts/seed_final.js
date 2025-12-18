import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';
import Routine from '../src/models/Routine.js'; // Assuming Routine model exists
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'ME', 'CIVIL', 'AIML'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

// Helper for random names
const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Diya', 'Saanvi', 'Anya', 'Aadhya', 'Pari', 'Ananya', 'Myra', 'Riya', 'Anvi', 'Kiara'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Mehta', 'Joshi', 'Nair', 'Reddy', 'Singh', 'Patel', 'Chopra', 'Desai', 'Kulkarni', 'Rao'];

const getRandomName = () => `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedFinal = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");
        await connectDB();

        console.log("🧹 Clearing DB...");
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Routine.deleteMany({}); // Optional

        console.log("🌱 Seeding Users...");

        // 1. Dean
        await User.create({
            name: "Dr. Dean Admin",
            email: "dean@campuscare.com",
            password: "password123",
            role: "dean",
            employeeId: "EMP-DEAN-01",
            designation: "Dean of Student Affairs"
        });

        // 1.5 Principal
        await User.create({
            name: "Dr. Principal",
            email: "principal@campuscare.com",
            password: "password123",
            role: "principal",
            employeeId: "EMP-PRIN-01",
            designation: "Principal"
        });

        // 2. HODs (3)
        const hodDepts = ['CSE', 'IT', 'ECE'];
        let hCount = 1;
        for (const dept of hodDepts) {
            await User.create({
                name: `Dr. HOD ${dept}`,
                email: `hod.${dept.toLowerCase()}@campuscare.com`,
                password: "password123",
                role: "hod",
                employeeId: `EMP-HOD-${String(hCount++).padStart(2, '0')}`,
                department: dept,
                designation: "Head of Department"
            });
        }

        // 3. Teachers (24)
        // 3. Teachers (8 Total - All IT)
        const SUBJECT_CATALOG = [
            "Internet Technology", "Cyber Security", "Soft Skills", "Project Management & Entrepreneurship",
            "Cryptography", "Network Security", "Internet of Things",
            "Software Engineering", "Compiler Design", "Operating Systems", "Introduction to Industrial Management", "Artificial Intelligence",
            "Database Management System", "Computer Networks", "Distributed System", "Data Warehouse & Data Mining",
            "Analog & Digital Electronics", "Data Structures & Algorithms", "Computer Organization", "Differential Calculus", "Economics for Engineers",
            "Discrete Mathematics", "Computer Architecture", "Formal Languages & Automata Theory", "Design & Analysis of Algorithms", "Biology for Engineers", "Environmental Science",
            "Physics for Engineers", "Chemistry for Engineers", "Mathematics for Engineers",
            "Calculus & Integration", "Basic Electrical Engineering"
        ];

        // Create specific expertise distribution to ensure 2x coverage
        // We have 8 teachers. 32 subjects x 2 = 64 slots. 8 slots per teacher.
        let expertiseDeck = [...SUBJECT_CATALOG, ...SUBJECT_CATALOG];

        // Shuffle deck
        for (let i = expertiseDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [expertiseDeck[i], expertiseDeck[j]] = [expertiseDeck[j], expertiseDeck[i]];
        }

        const teachers = [];
        for (let i = 1; i <= 8; i++) {
            // Take 8 subjects for this teacher
            const teacherExpertise = expertiseDeck.splice(0, 8);

            // Fallback if deck runs out (unlikely with exact math, but good safety)
            if (teacherExpertise.length < 5) {
                teacherExpertise.push(...SUBJECT_CATALOG.slice(0, 5 - teacherExpertise.length));
            }

            const teacher = await User.create({
                name: `Prof. IT Faculty ${i}`,
                email: `prof.it${i}@campuscare.com`,
                password: "password123",
                role: "teacher",
                employeeId: `EMP-IT-${String(i).padStart(3, '0')}`,
                department: "IT",
                designation: "Assistant Professor",
                menteesSubBatches: [], // Will be assigned
                expertise: teacherExpertise
            });
            teachers.push(teacher);
        }

        // 4. Students (1200)
        // 300 per year. 50 per department per year (6 depts).
        // 4. Students (400 Total - 100 per year)
        // Strict Rules:
        // Dept: IT (All)
        // Years: 4th, 3rd, 2nd, 1st
        // Batch 1: 1-50 (SubBatch 11: 1-25, SubBatch 12: 26-50)
        // Batch 2: 51-100 (SubBatch 21: 51-75, SubBatch 22: 76-100)
        // Hostelers: Last 5 of each sub-batch (21-25, 46-50, 71-75, 96-100)

        const students = [];
        let globalRollCounter = 1001; // Started at 1001 as per request

        // Order mapping for clean roll numbers if needed, assuming 4th year starts at 1
        const YEAR_ORDER = ['4th Year', '3rd Year', '2nd Year', '1st Year'];

        for (const year of YEAR_ORDER) {
            console.log(`... Preparing ${year} (IT Only)`);

            for (let i = 1; i <= 100; i++) {
                // Determine Batch & SubBatch
                let batch = '';
                let subBatch = '';
                let isHosteler = false;

                if (i <= 25) {
                    batch = 'Batch 1';
                    subBatch = 'Batch 11';
                    if (i > 20) isHosteler = true; // 21-25
                } else if (i <= 50) {
                    batch = 'Batch 1';
                    subBatch = 'Batch 12';
                    if (i > 45) isHosteler = true; // 46-50
                } else if (i <= 75) {
                    batch = 'Batch 2';
                    subBatch = 'Batch 21';
                    if (i > 70) isHosteler = true; // 71-75
                } else { // 76-100
                    batch = 'Batch 2';
                    subBatch = 'Batch 22';
                    if (i > 95) isHosteler = true; // 96-100
                }

                const role = isHosteler ? 'hosteler' : 'student';

                students.push({
                    name: getRandomName(),
                    email: `studentIT${globalRollCounter}@campuscare.com`,
                    password: "password123",
                    role: role,
                    department: "IT", // STRICTLY IT
                    year: year,
                    batch: batch,
                    subBatch: subBatch,
                    rollNumber: globalRollCounter.toString(),

                    // Hosteler Details
                    hostelName: isHosteler ? "Boys Hostel A" : undefined,
                    roomNumber: isHosteler ? "101" : undefined
                });

                globalRollCounter++;
            }
        }

        // Batch insert for speed
        const createdStudents = await User.insertMany(students);
        console.log(`✅ Seeded ${createdStudents.length} Students.`);

        // 5. Mentor Mapping
        // Distribute students among teachers of same dept?
        // simple logic: 24 teachers. 1200 students. 50 students per teacher.
        // We have 4 teachers per dept.
        // We have 200 students per dept (50 * 4 years).
        // So each teacher gets ~50 students.
        // Let's assign by iterating teachers and verifying Dept match.

        console.log("🔗 Mapping Mentors...");

        for (const teacher of teachers) {
            // Find 50 unassigned students in same dept
            const potentialMentees = await User.find({
                role: 'student',
                department: teacher.department,
                mentor: { $exists: false }
            }).limit(50);

            if (potentialMentees.length > 0) {
                const menteeIds = potentialMentees.map(s => s._id);

                // Update Students
                await User.updateMany(
                    { _id: { $in: menteeIds } },
                    { mentor: teacher._id }
                );

                // Update Teacher
                // Also assign sub-batches logic: assume they handle "1-1" or "1-2" of a specific year.
                // For "Phase 6" check, we added `menteesSubBatches`.
                // Let's just give them 2 random sub-batches to enable the feature.
                teacher.mentees = menteeIds;
                teacher.menteesSubBatches = ['1-1', '1-2'];
                await teacher.save();
            }
        }

        console.log("✅ Mentor Mapping Complete.");
        console.log("🌱 Database Seeding Finished (Phase 10).");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedFinal();
