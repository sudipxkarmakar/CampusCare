
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/campus_care';

const checkStudentData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find a few students
        const students = await User.find({ role: 'student' }).limit(3);

        console.log('--- Student Data Sample ---');
        students.forEach(s => {
            console.log(`Name: ${s.name} (${s.rollNumber})`);
            console.log(`  Dept: ${s.department}`);
            console.log(`  BloodGroup: ${s.bloodGroup}`);
            console.log(`  Contact: ${s.contactNumber}`);
            console.log('---------------------------');
        });

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

checkStudentData();
