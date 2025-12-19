
import mongoose from 'mongoose';
import Routine from '../src/models/Routine.js'; // Ensure path is correct
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

const checkRoutines = async () => {
    await connectDB();
    const routines = await Routine.find({});
    console.log(`Found ${routines.length} routines.`);
    if (routines.length > 0) {
        console.log('Sample Routine:', JSON.stringify(routines[0], null, 2));

        // Check if any have 'semester'
        const withSem = routines.filter(r => r.semester !== undefined);
        console.log(`Routines with 'semester' field: ${withSem.length}`);
    }
    process.exit();
};

checkRoutines();
