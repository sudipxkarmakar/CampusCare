import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Routine from '../src/models/Routine.js';
import User from '../src/models/User.js'; // Import User to populate teacher
import connectDB from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkRoutines = async () => {
    try {
        await connectDB();
        console.log('Database Connected.');

        const routines = await Routine.find({}).populate('teacher', 'name email');

        if (routines.length === 0) {
            console.log("No routines found.");
        } else {
            console.log(`Found ${routines.length} routine entries.`);
            routines.forEach(r => {
                console.log(`ID: ${r._id}`);
                console.log(`  Subject: ${r.subjectName} (${r.subject})`);
                console.log(`  Batch: ${r.batch}`);
                console.log(`  Teacher: ${r.teacher ? `${r.teacher.name} (${r.teacher._id})` : 'UNASSIGNED'}`);
                console.log('-----------------------------------');
            });
        }
        process.exit();

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkRoutines();
