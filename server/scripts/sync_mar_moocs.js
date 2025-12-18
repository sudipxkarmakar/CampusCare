import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import MarMooc from '../src/models/MarMooc.js';

// Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const syncData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} students. Syncing...`);

        let updatedCount = 0;

        for (const student of students) {
            const records = await MarMooc.find({ student: student._id });

            const totalMar = records
                .filter(r => r.category === 'mar')
                .reduce((acc, curr) => acc + (curr.points || 0), 0);

            const totalMooc = records
                .filter(r => r.category === 'mooc')
                .reduce((acc, curr) => acc + (curr.points || 0), 0);

            // Update if different
            if (student.mar !== totalMar || student.moocs !== totalMooc) {
                console.log(`Syncing ${student.name}: MAR ${student.mar}->${totalMar}, MOOC ${student.moocs}->${totalMooc}`);
                student.mar = totalMar;
                student.moocs = totalMooc;
                await student.save();
                updatedCount++;
            }
        }

        console.log(`Sync Complete. Updated ${updatedCount} students.`);
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

syncData();
