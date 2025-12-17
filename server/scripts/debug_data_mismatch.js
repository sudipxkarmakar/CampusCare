
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';

dotenv.config();

const debugData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuscare");
        console.log("Connected...");

        console.log("\n--- USERS (Role: hod or who might be logged in) ---");
        const users = await User.find({});
        users.forEach(u => {
            if (['hod', 'teacher', 'admin'].includes(u.role)) {
                console.log(`User: ${u.name} | Role: ${u.role} | Dept: "${u.department}" | Email: ${u.email}`);
            }
        });

        console.log("\n--- SUBJECTS (Sample) ---");
        const subjects = await Subject.find({}).limit(10);
        subjects.forEach(s => {
            console.log(`Subject: ${s.name} | Dept: "${s.department}" | AcadYear: ${s.academicYear}`);
        });

        const itSubjects = await Subject.countDocuments({ department: 'IT' });
        const cseSubjects = await Subject.countDocuments({ department: 'CSE' });
        console.log(`\nStats: IT Subjects=${itSubjects}, CSE Subjects=${cseSubjects}`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debugData();
