import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const updateStudents = async () => {
    try {
        await connectDB();
        console.log("🚀 Starting Student Data Migration...");

        // Find all students and hostelers
        const students = await User.find({ role: { $in: ['student', 'hosteler'] } });
        console.log(`Found ${students.length} students/hostelers to update.`);

        let updatedCount = 0;
        const bulkOps = students.map(student => {
            // Generate random values for realism
            const randomAttendance = (Math.random() * (100 - 60) + 60).toFixed(1); // 60-100%
            const randomCGPA = (Math.random() * (10 - 6) + 6).toFixed(2); // 6.0-10.0
            const randomMAR = Math.floor(Math.random() * 20); // 0-20 points
            const randomMOOCS = Math.floor(Math.random() * 3); // 0-3 courses

            return {
                updateOne: {
                    filter: { _id: student._id },
                    update: {
                        $unset: { xp: "", streak: "" }, // Remove old fields
                        $set: {
                            attendance: parseFloat(randomAttendance),
                            cgpa: parseFloat(randomCGPA),
                            mar: randomMAR,
                            moocs: randomMOOCS
                        }
                    }
                }
            };
        });

        if (bulkOps.length > 0) {
            await User.bulkWrite(bulkOps);
            console.log(`✅ Successfully updated ${bulkOps.length} student records.`);
        } else {
            console.log("No students found to update.");
        }

        process.exit(0);

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
};

updateStudents();
