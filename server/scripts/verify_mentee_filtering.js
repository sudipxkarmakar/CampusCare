import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const verifyMenteeFiltering = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // 1. Find a Random Teacher
        const teacher = await User.findOne({ role: 'teacher' }).populate('mentees');

        if (!teacher) {
            console.error('No Teacher found');
            process.exit(1);
        }

        console.log(`Teacher: ${teacher.name} (${teacher.employeeId})`);
        console.log(`Total Mentees: ${teacher.mentees.length}`);

        if (teacher.mentees.length === 0) {
            console.log('No mentees assigned to this teacher.');
            process.exit(0);
        }

        const mentees = teacher.mentees;
        // List all first
        console.log('--- All Mentees ---');
        mentees.forEach(m => console.log(`  ${m.name} - ${m.rollNumber}`));

        // 2. Simulate Filter by Roll
        const sampleMentee = mentees[0];
        // Use part of their roll number
        const searchTerm = sampleMentee.rollNumber.substring(4); // e.g. "2024-1001"
        console.log(`\n--- Filtering by "${searchTerm}" ---`);

        const searchRegex = new RegExp(searchTerm, 'i');
        const filtered = mentees.filter(student =>
            (student.rollNumber && student.rollNumber.match(searchRegex)) ||
            (student.name && student.name.match(searchRegex))
        );

        console.log(`Found: ${filtered.length}`);
        filtered.forEach(m => console.log(`  ${m.name} - ${m.rollNumber}`));

        if (filtered.length > 0 && filtered.find(m => m.rollNumber === sampleMentee.rollNumber)) {
            console.log('VERIFICATION PASSED: Filter logic works.');
        } else {
            console.error('VERIFICATION FAILED: Filter logic did not find the student.');
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyMenteeFiltering();
