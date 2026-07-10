import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function run() {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
    await mongoose.connect(mongoURI);
    
    const students = await User.find({ role: { $in: ['student', 'hosteler'] } }).lean();
    console.log(`--- SEEDED STUDENTS DATA ---`);
    for (const s of students) {
        console.log(`Name: ${s.name}`);
        console.log(`  Roll: ${s.rollNumber || 'N/A'}`);
        console.log(`  Dept: ${s.department || 'N/A'}`);
        console.log(`  CGPA: ${s.cgpa || 0}`);
        console.log(`  Attendance: ${s.attendance || 0}%`);
        console.log(`  MAR Points: ${s.mar || 0}`);
        console.log(`  Backlogs: ${s.backlogs || 0}`);
        console.log(`  Phone: ${s.contactNumber || 'N/A'}`);
        console.log('-----------------------------');
    }
    process.exit(0);
}

run().catch(console.error);
