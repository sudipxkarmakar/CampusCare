import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

dotenv.config();

const run = async () => {
    await connectDB();
    const students = await User.find({
        role: 'student',
        cgpa: { $gt: 9 }
    }).lean();
    console.log(`Found ${students.length} students with CGPA > 9:`);
    console.log(students.map(u => ({ name: u.name, contactNumber: u.contactNumber })));
    process.exit(0);
};

run();
