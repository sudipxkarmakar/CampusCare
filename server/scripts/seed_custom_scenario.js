
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';
import Routine from '../src/models/Routine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedCustom = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB");

        console.log("🧹 Clearing relevant collections...");
        await User.deleteMany({});
        await Subject.deleteMany({});
        await Routine.deleteMany({});

        // --- 1. SPECIAL ROLES ---
        console.log("🌱 Seeding Staff...");

        await User.create({
            name: "Dr. Principal",
            email: "principal@campuscare.com",
            password: "password123",
            role: "principal",
            employeeId: "EMP-PRIN-01",
            designation: "Principal"
        });

        await User.create({
            name: "Mr. Warden",
            email: "warden@campuscare.com",
            password: "password123",
            role: "warden",
            employeeId: "EMP-WARDEN-01",
            designation: "Chief Warden"
        });

        // 3 HODs
        const hods = ['IT', 'CSE', 'AIML'];
        for (const dept of hods) {
            await User.create({
                name: `HOD ${dept}`,
                email: `hod.${dept.toLowerCase()}@campuscare.com`,
                password: "password123",
                role: "hod",
                employeeId: `EMP-HOD-${dept}`,
                department: dept,
                designation: "Head of Department"
            });
        }

        // 8 Teachers (ALL IT)
        const teachers = [];
        for (let i = 1; i <= 8; i++) {
            const teacher = await User.create({
                name: `Prof. IT ${i}`,
                email: `prof.it${i}@campuscare.com`,
                password: "password123",
                role: "teacher",
                employeeId: `EMP-IT-FAC-${String(i).padStart(3, '0')}`,
                department: "IT",
                designation: "Assistant Professor",
                menteesSubBatches: []
            });
            teachers.push(teacher);
        }

        // --- 2. SUBJECTS (16 Total) ---
        console.log("🌱 Seeding Subjects...");
        // Distribute 16 subjects among 8 teachers (2 per teacher)
        for (let i = 1; i <= 16; i++) {
            await Subject.create({
                name: `IT Subject ${i}`,
                code: `IT-SUB-${100 + i}`,
                department: 'IT',
                year: i <= 4 ? '1st Year' : (i <= 8 ? '2nd Year' : (i <= 12 ? '3rd Year' : '4th Year')),
                semester: Math.ceil(i / 2),
                teacher: teachers[(i - 1) % teachers.length]._id,
                teachers: [teachers[(i - 1) % teachers.length]._id]
            });
        }

        // --- 3. STUDENTS (400 Total - ALL IT) ---
        console.log("🌱 Seeding 400 IT Students...");
        const students = [];

        // Helper to determine batch/role
        // Requirement: "1 in the start of the id refers to the dept IT"
        // Let's use Roll Numbers: 1001 to 1400.

        for (let i = 0; i < 400; i++) {
            const seqNum = i + 1;
            const rollNumber = `1${String(seqNum).padStart(3, '0')}`; // 1001, 1002...

            let year, passOutYear, batch, subBatch, role, hostelName, roomNumber;
            const isHosteler = (i % 5 === 0) || (i >= 20 && i < 25); // Mix. Example: Every 5th + a small block.
            // User Example: "1000-1020 normal student, 1020-1025 hostlers"
            // Let's use a simpler pattern: First 20 of every 100 are hostelers?
            // Or just random. User said: "among them let's say 1000-1020 are normal students and 1020-1025 are hostlers"
            // I'll make it chunky.

            // Logic for first 100 (4th Year, 2026 Passout)
            if (i < 100) {
                year = "4th Year";
                passOutYear = "2026";

                // Batches: 1-50 -> Batch 1, 51-100 -> Batch 2
                if (i < 50) {
                    batch = "1";
                    // Sub-batches: 1-25 -> 11, 26-50 -> 12
                    subBatch = i < 25 ? "11" : "12";
                } else {
                    batch = "2";
                    // Sub-batches: 51-75 -> 21, 76-100 -> 22
                    subBatch = i < 75 ? "21" : "22";
                }
            } else {
                // Remaining 300 (1st, 2nd, 3rd Year)
                const remainderIndex = i - 100;
                if (remainderIndex < 100) {
                    year = "3rd Year";
                    passOutYear = "2027";
                } else if (remainderIndex < 200) {
                    year = "2nd Year";
                    passOutYear = "2028";
                } else {
                    year = "1st Year";
                    passOutYear = "2029";
                }
                batch = "A"; // Default
                subBatch = "A1";
            }

            // Role Logic (Chunky to match user preference)
            // e.g., 5 students Normal, 1 Hosteler. Or "1000-1020 Normal, 1020-1025 Hosteler" (ratio 4:1)
            // Let's do blocks of 5. 4 Normal, 1 Hosteler? Or matching the user's "Example range".
            // I'll just use a mod: if (i % 10 >= 8) -> Hosteler. (20% hostelers).

            if (i % 10 >= 7) { // 30% Hostelers (7,8,9 in every 10)
                role = "hosteler";
                hostelName = "IT Boys Hostel";
                roomNumber = String(100 + (i % 50));
            } else {
                role = "student";
                hostelName = null;
                roomNumber = null;
            }

            students.push({
                name: `IT Student ${seqNum}`,
                email: `it.student${seqNum}@campuscare.com`,
                password: "password123",
                role: role,
                department: "IT",
                rollNumber: rollNumber,
                year: year,
                passOutYear: passOutYear,
                batch: batch,
                subBatch: subBatch,
                hostelName: hostelName,
                roomNumber: roomNumber
            });
        }

        await User.insertMany(students);
        console.log(`✅ Seeded ${students.length} IT Students.`);

        console.log("🌱 Seeding Complete.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Seeding Failed:", e);
        process.exit(1);
    }
};

seedCustom();
