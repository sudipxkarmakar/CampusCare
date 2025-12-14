import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const verifyStudentSearch = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Test 1: Search by Name
        const searchTerm = 'CSE 5'; // Should match Student CSE 5, CSE 50, etc.
        console.log(`\nSearching for "${searchTerm}"...`);

        const searchRegex = new RegExp(searchTerm, 'i');
        const query = {
            role: 'student',
            $or: [
                { name: searchRegex },
                { rollNumber: searchRegex }
            ]
        };

        const students = await User.find(query);
        console.log(`Found: ${students.length}`);

        students.slice(0, 5).forEach(s => console.log(`  ${s.name} (${s.rollNumber})`));
        if (students.length > 5) console.log('  ...');

        if (students.length > 0) {
            console.log('VERIFICATION PASSED: Search query returns results.');
        } else {
            // If seed was run, there should be "Student CSE 5" etc.
            console.warn('VERIFICATION WARNING: No students found. Check seed data.');
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyStudentSearch();
