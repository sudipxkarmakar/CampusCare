
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const updateStudentFields = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB");

        const students = await User.find({ role: { $in: ['student', 'hosteler'] } });
        console.log(`Found ${students.length} students/hostelers to update.`);

        let updatedCount = 0;

        for (const student of students) {
            let passOutYear, semester;

            // Mapping Logic (Odd Semesters)
            if (student.year === '4th Year') {
                passOutYear = '2026';
                semester = 7;
            } else if (student.year === '3rd Year') {
                passOutYear = '2027';
                semester = 5;
            } else if (student.year === '2nd Year') {
                passOutYear = '2028';
                semester = 3;
            } else if (student.year === '1st Year') {
                passOutYear = '2029';
                semester = 1;
            }

            if (passOutYear && semester) {
                student.passOutYear = passOutYear;
                student.semester = semester;
                await student.save();
                updatedCount++;
            }
        }

        console.log(`✅ Successfully updated ${updatedCount} records.`);
        process.exit(0);
    } catch (e) {
        console.error("❌ Update Failed:", e);
        process.exit(1);
    }
};

updateStudentFields();
