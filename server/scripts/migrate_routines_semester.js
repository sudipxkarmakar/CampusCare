
import mongoose from 'mongoose';
import Routine from '../src/models/Routine.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const migrate = async () => {
    await connectDB();

    const routines = await Routine.find({});
    console.log(`Found ${routines.length} routines.`);

    let updated = 0;
    for (const r of routines) {
        let sem = null;
        if (r.year === '1st Year') sem = 1;
        else if (r.year === '2nd Year') sem = 3;
        else if (r.year === '3rd Year') sem = 5;
        else if (r.year === '4th Year') sem = 7;

        if (sem) {
            r.semester = sem;
            await r.save();
            updated++;
        }
    }

    console.log(`Updated ${updated} routines with semester info.`);
    process.exit();
};

migrate();
