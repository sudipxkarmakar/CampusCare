import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const updateRollNumbers = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");
        await connectDB();

        console.log("🔍 Finding students to update...");

        // Find students and hostelers
        const students = await User.find({
            role: { $in: ['student', 'hosteler'] }
        });

        console.log(`Found ${students.length} students/hostelers.`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const student of students) {
            const currentRoll = parseInt(student.rollNumber);

            if (!isNaN(currentRoll) && currentRoll >= 1 && currentRoll <= 1000) { // Safety check to update only low numbers
                const newRoll = (currentRoll + 1000).toString();
                student.rollNumber = newRoll;
                // Also update email if it contains the roll number to match seed logic?
                // Seed logic: email: `studentIT${globalRollCounter}@campuscare.com`
                // Current email might be `studentIT1@campuscare.com`.
                // Let's update email too to correspond to the roll number, to keep it consistent with seed_final.js
                if (student.email.startsWith('studentIT')) {
                    student.email = `studentIT${newRoll}@campuscare.com`;
                }

                await student.save();
                process.stdout.write(`\rUpdated ${currentRoll} -> ${newRoll}   `);
                updatedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`\n✅ Finished.`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Skipped: ${skippedCount} (Already updated or invalid format)`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

updateRollNumbers();
