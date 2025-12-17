
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../src/models/Subject.js';
import User from '../src/models/User.js';

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuscare");
        console.log("Connected to MongoDB...");

        // 1. Check Subjects
        const years = ["2026", "2027", "2028", "2029"];
        console.log("\n--- Verifying Subjects ---");
        for (const yr of years) {
            const count = await Subject.countDocuments({ academicYear: yr });
            console.log(`Academic Year ${yr}: Found ${count} subjects.`);
        }

        const totalSubjects = await Subject.countDocuments({ academicYear: { $in: years } });
        console.log(`Total seeded subjects: ${totalSubjects}`);

        // 2. Check Teacher Expertise
        console.log("\n--- Verifying Teacher Expertise ---");
        const teachers = await User.find({ role: 'teacher' }).limit(5);
        if (teachers.length === 0) console.log("No teachers found.");

        teachers.forEach(t => {
            console.log(`Teacher: ${t.name} | Expertise: ${t.expertise ? t.expertise.join(', ') : 'None'}`);
        });

        process.exit();
    } catch (error) {
        console.error("Verification Error:", error);
        process.exit(1);
    }
};

verify();
