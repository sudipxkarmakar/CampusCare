import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function run() {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected.');

    const roles = ['student', 'hosteler', 'teacher', 'warden', 'hod', 'principal'];
    for (const r of roles) {
        const u = await User.findOne({ role: r });
        if (u) {
            console.log(`Role: ${r.toUpperCase()} | Name: ${u.name} | Identifier: ${u.rollNumber || u.employeeId || u.email} | Password: password123 (or check hash: ${u.password ? 'present' : 'none'}) | Dept: ${u.department || 'N/A'}`);
        } else {
            console.log(`Role: ${r.toUpperCase()} | NOT FOUND`);
        }
    }

    process.exit(0);
}

run().catch(console.error);
