
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Routine from '../src/models/Routine.js';
// Intentionally NOT importing Subject here to mimic controller state (if it relies on global registration)
// But actually, in a standalone script, I MUST import schemas to even use them, or they won't exist.
// However, to mimic the controller failing, I should set up the environment exactly like the server.
// If I import Subject here, it registers it. 
// A better test for the controller is to import the controller itself? No, that's complex with req/res mocks.
// I'll just write a script that does exactly what the controller does: find().populate().
// If I omit importing Subject, Mongoose in this script won't know it.
// IN THE SERVER: server.js imports routes. Routes import controller. Controller imports Routine. 
// If NOTHING imports Subject.js, it's not registered.

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

const verifyEndpoint = async () => {
    await connectDB();

    // Find the user Sudip
    const user = await User.findOne({ rollNumber: '1001' });
    if (!user) { console.log('User not found'); process.exit(); }

    const query = {
        department: user.department,
        ...(user.semester ? { semester: user.semester } : { year: user.year }),
        batch: user.batch
    };

    try {
        console.log('Attempting to fetch with populate...');
        // Only importing User and Routine above. Subject is NOT imported.
        // This should fail if Subject schema isn't registered.
        const routines = await Routine.find(query)
            .populate('subject', 'name code') // This triggers the error
            .populate('teacher', 'name');

        console.log(`Success! Found ${routines.length} routines.`);
        if (routines.length > 0) {
            console.log('Sample Subject:', routines[0].subject);
        }
    } catch (err) {
        console.error('FAILED:', err.message);
    }

    process.exit();
};

verifyEndpoint();
