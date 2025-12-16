import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedStaff = async () => {
    try {
        await connectDB();
        console.log("🚀 Starting Staff Seed...");

        const staffToInsert = [];

        // 1. Principal (1)
        staffToInsert.push({
            name: "Dr. Principal",
            email: "principal@campuscare.com",
            password: "password123",
            role: "principal",
            designation: "Principal",
            employeeId: "P001",
            contactNumber: "9988776655"
        });

        // 2. Warden (1)
        staffToInsert.push({
            name: "Hostel Warden",
            email: "warden@campuscare.com",
            password: "password123",
            role: "warden",
            designation: "Warden",
            employeeId: "W001",
            contactNumber: "9988776644"
        });

        // 3. HODs (3)
        const depts = ["CSE", "IT", "AIML"];
        depts.forEach((dept, i) => {
            staffToInsert.push({
                name: `HOD ${dept}`,
                email: `hod.${dept.toLowerCase()}@campuscare.com`,
                password: "password123",
                role: "hod",
                department: dept,
                designation: "Head of Department",
                employeeId: `HOD${i + 1}`,
                contactNumber: `900000000${i}`
            });
        });

        // 4. Teachers (24)
        // Divide into depts? 8 per dept.
        for (let i = 1; i <= 24; i++) {
            let dept = "CSE";
            if (i > 8) dept = "IT";
            if (i > 16) dept = "AIML";

            staffToInsert.push({
                name: `Teacher ${i}`,
                email: `teacher${i}@campuscare.com`,
                password: "password123",
                role: "teacher",
                department: dept,
                designation: "Assistant Professor",
                employeeId: `T${100 + i}`,
                contactNumber: "9876543210",
                // Phase 2 Fields (Mocked)
                teachingBatches: ["1st Year", "2nd Year"],
                teachingSubjects: ["Subject A", "Subject B"],
                weeklyLoad: 12
            });
        }

        console.log(`Prepared ${staffToInsert.length} staff records. Inserting...`);

        // Use insertMany
        await User.insertMany(staffToInsert, { ordered: false });

        console.log(`✅ Successfully seeded staff!`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Staff Seeding failed:", error);
        process.exit(1);
    }
};

seedStaff();
