
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Subject from '../src/models/Subject.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from the same place as server
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkData = async () => {
    try {
        console.log("Using Mongo URI:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to: ${mongoose.connection.host}`);

        const allSubjects = await Subject.find({});
        console.log(`Total Subjects in DB: ${allSubjects.length}`);

        const itSubjects = await Subject.find({ department: 'IT' });
        console.log(`Subjects with department='IT': ${itSubjects.length}`);

        const year2026 = await Subject.find({ academicYear: '2026' });
        console.log(`Subjects with academicYear='2026': ${year2026.length}`);

        const target = await Subject.find({ department: 'IT', academicYear: '2026' });
        console.log(`Subjects with Dept='IT' AND AcadYear='2026': ${target.length}`);

        if (target.length > 0) {
            console.log("Sample Subject:", JSON.stringify(target[0], null, 2));
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();
