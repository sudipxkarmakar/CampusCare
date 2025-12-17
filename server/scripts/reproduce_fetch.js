
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../src/models/Subject.js';

dotenv.config();

const reproduce = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuscare");
        console.log("Connected...");

        const dept = "IT"; // Testing for IT
        const year = "2026";

        console.log(`Querying: { department: '${dept}', academicYear: '${year}' }`);
        // Use regex for department to be safe against whitespace? No, strict first.
        const subjects = await Subject.find({ department: dept, academicYear: year });
        console.log(`Found ${subjects.length} subjects.`);

        if (subjects.length > 0) {
            console.log("Sample:", subjects[0]);
        } else {
            // Debug: check distinct departments
            const depts = await Subject.distinct('department');
            console.log("Available Departments:", depts);
            const years = await Subject.distinct('academicYear');
            console.log("Available Years:", years);
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

reproduce();
