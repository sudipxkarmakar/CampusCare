import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkAndSeedTeacher = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI missing");
            process.exit(1);
        }
        await connectDB();

        const teacher = await User.findOne({ role: 'teacher' }); // Case sensitive? Enum is 'teacher' lowercase

        if (teacher) {
            console.log(`✅ Teacher exists: ${teacher.name} (${teacher.email})`);
        } else {
            console.log("⚠️ No teacher found. Creating one...");
            const newTeacher = await User.create({
                name: "Prof. Verify",
                email: "teacher@test.com",
                password: "password123", // fast hash or plain if dev? Assume hashed by pre-save or plain for now if allowed
                role: "teacher",
                department: "CSE",
                details: {
                    joiningYear: 2020,
                    designation: "Assistant Professor"
                }
            });
            console.log(`✅ Created Teacher: ${newTeacher.name} (${newTeacher.email})`);
        }
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkAndSeedTeacher();
