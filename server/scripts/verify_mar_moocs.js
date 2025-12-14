import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MarMooc from '../src/models/MarMooc.js';
import User from '../src/models/User.js';

dotenv.config();

const verifyMarMoocs = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        const totalEntries = await MarMooc.countDocuments();
        console.log(`Total MAR/MOOC Entries: ${totalEntries}`);

        const verifiedEntries = await MarMooc.countDocuments({ status: 'Verified' });
        console.log(`Verified Entries: ${verifiedEntries}`);

        // Check a random student
        const student = await User.findOne({ role: 'student' });
        if (student) {
            const studentEntries = await MarMooc.find({ student: student._id });
            console.log(`\nSample Student: ${student.name} (${student.rollNumber})`);
            console.log(`Entries found: ${studentEntries.length}`);
            studentEntries.forEach(entry => {
                console.log(` - ${entry.title} [${entry.platform}] (${entry.status}) - Points: ${entry.points}`);
            });
        }

        process.exit(0);

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
};

verifyMarMoocs();
