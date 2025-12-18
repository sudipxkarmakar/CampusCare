
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../src/models/Subject.js';
// We will simply run the seeding data from here or import it if we could, 
// but to be safe and "Seed Subject Data Consistently", I'll replicate the core logic or just call the other script via shell.
// For this script, I'll focus on the CLEANUP. The user said "Seed Subject Data Consistently" as step 2.
// I will just use this script to CLEAN, and then I will run the existing seed script which is reliable.

dotenv.config();

const cleanAndReport = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuscare");
        console.log("Connected to MongoDB for cleanup...");

        // 1. Identify bad data
        const badSubjects = await Subject.find({ academicYear: { $exists: false } });
        console.log(`Found ${badSubjects.length} subjects WITHOUT academicYear.`);

        if (badSubjects.length > 0) {
            // 2. Delete bad data
            const res = await Subject.deleteMany({ academicYear: { $exists: false } });
            console.log(`Deleted ${res.deletedCount} subjects missing academicYear.`);
        } else {
            console.log("No invalid subjects found.");
        }

        // 3. Optional: Check for any other inconsistencies?
        // User asked to remove ONLY those without academicYear. Done.

        console.log("Cleanup complete.");
        process.exit();
    } catch (error) {
        console.error("Cleanup Error:", error);
        process.exit(1);
    }
};

cleanAndReport();
