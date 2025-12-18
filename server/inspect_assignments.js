import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

import Subject from './src/models/Subject.js';
import User from './src/models/User.js';

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find 4th Year subjects
        const subjects = await Subject.find({ year: '4th Year' }).populate('batchAssignments.teacher', 'name email');

        console.log(`Found ${subjects.length} subjects for 4th Year`);

        subjects.forEach(sub => {
            console.log(`\nID: ${sub._id} | Subject: ${sub.name} (${sub.code})`);
            console.log('Full Doc:', JSON.stringify(sub, null, 2));
        });

        const teachers = await User.find({ role: 'teacher' }).select('name email');
        console.log('\n--- Teachers ---');
        teachers.forEach(t => console.log(`ID: ${t._id} | ${t.name}`));

        // Generate HOD Token
        const hod = await User.findOne({ role: 'hod', department: 'IT' });
        if (hod) {
            const jwt = (await import('jsonwebtoken')).default;
            const token = jwt.sign({ id: hod._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            console.log('\n--- HOD TOKEN ---');
            // Write to file
            const fs = await import('fs');
            fs.writeFileSync('token.txt', token);
            console.log('Token written to token.txt');
        } else {
            console.log('No HOD found for IT');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

inspect();
