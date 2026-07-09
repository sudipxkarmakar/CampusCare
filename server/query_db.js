import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Complaint from './src/models/Complaint.js';

dotenv.config();

async function run() {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected.');

    const students = await User.find({ role: 'student' }).limit(3);
    console.log('Students in DB:');
    students.forEach(s => {
        console.log(`Name: ${s.name}, Email: ${s.email}, Role: ${s.role}, Dept: ${s.department}`);
    });

    const staffList = await User.find({ role: 'staff' });
    console.log('\nStaff in DB:');
    staffList.forEach(st => {
        console.log(`Name: ${st.name}, Designation: ${st.designation}, Phone: ${st.contactNumber}`);
    });

    const latestComplaints = await Complaint.find().sort({ createdAt: -1 }).limit(3).populate('assignedStaff');
    console.log('\nLatest Complaints in DB:');
    latestComplaints.forEach(c => {
        console.log(`Title: ${c.title}, Location: ${c.location}, Category: ${c.category}, Assigned Staff: ${c.assignedStaff ? c.assignedStaff.name : 'NONE'}`);
    });

    process.exit(0);
}

run().catch(console.error);
