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
        // 4 per department for 6 departments
        const teachers = [];
        let tCount = 1;
        for (const dept of DEPARTMENTS) {
            for (let i = 1; i <= 4; i++) {
                const teacher = await User.create({
                    name: `Prof. ${dept} ${i}`,
                    email: `prof.${dept.toLowerCase()}${i}@campuscare.com`,
                    password: "password123",
                    role: "teacher",
                    employeeId: `EMP-FAC-${String(tCount++).padStart(3, '0')}`,
                    department: dept,
                    designation: "Assistant Professor",
                    menteesSubBatches: []
                });
                teachers.push(teacher);
            }
        }

        // 4. Students (1200)
        // 300 per year. 50 per department per year (6 depts).
        const students = [];
        let rollCounter = 1000;

        for (const year of YEARS) {
            for (const dept of DEPARTMENTS) {
                // 50 students per Dept/Year combo
                for (let i = 1; i <= 50; i++) {
                    const batch = i <= 25 ? '1' : '2';
                    const subBatch = i <= 25 ? (i <= 12 ? '1-1' : '1-2') : (i <= 37 ? '2-1' : '2-2');

                    students.push({
                        name: getRandomName(),
                        email: `student${rollCounter}@campuscare.com`, // Unique email
                        password: "password123",
                        role: "student",
                        department: dept,
                        year: year,
                        batch: batch,
                        subBatch: subBatch, // Important for logic
                        rollNumber: rollCounter.toString(),
                        hostelName: Math.random() > 0.7 ? "Boys Hostel A" : null, // 30% hostelers
                        roomNumber: Math.random() > 0.7 ? "101" : null
                    });
                    rollCounter++;
                }
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
