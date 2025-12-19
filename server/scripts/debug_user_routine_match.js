
import mongoose from 'mongoose';
import User from '../src/models/User.js';
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

const debugUserRoutine = async () => {
    await connectDB();

    // Find the user Sudip (Roll 1001)
    const user = await User.findOne({ rollNumber: '1001' });
    if (!user) {
        console.log('User Sudip (1001) not found!');
        process.exit();
    }

    console.log('User Found:', user.name);
    console.log('User Role:', user.role);
    console.log('User Department:', user.department);
    console.log('User Year:', user.year);
    console.log('User Semester:', user.semester);
    console.log('User Batch:', user.batch);

    // Simulate Controller Query Logic
    const query = {
        department: user.department,
        // The logic I implemented:
        ...(user.semester ? { semester: user.semester } : { year: user.year }),
        batch: user.batch
    };

    console.log('Constructed Query:', JSON.stringify(query, null, 2));

    try {
        const routines = await Routine.find(query);
        console.log(`Found ${routines.length} routines matching this query.`);
        if (routines.length > 0) {
            console.log('Sample Routine:', JSON.stringify(routines[0], null, 2));
        } else {
            // Check if maybe standard Year query works?
            console.log('Checking fallback query (Year only)...');
            const fallbackQuery = {
                department: user.department,
                year: user.year,
                batch: user.batch
            };
            const fallbackRoutines = await Routine.find(fallbackQuery);
            console.log(`Found ${fallbackRoutines.length} routines using OLD year-based query.`);
        }
    } catch (err) {
        console.error('Error fetching routines:', err);
    }

    process.exit();
};

debugUserRoutine();
