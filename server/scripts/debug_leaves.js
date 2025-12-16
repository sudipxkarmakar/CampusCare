import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Leave from '../src/models/Leave.js';
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

const checkLeaves = async () => {
    await connectDB();

    // 1. Find Teacher Komal
    const teacher = await User.findOne({ name: /KOMAL/i, role: 'teacher' });
    if (!teacher) {
        console.log('Teacher Komal not found!');
        return;
    }
    console.log(`Teacher: ${teacher.name} (ID: ${teacher._id})`);
    console.log(`Mentees Count: ${teacher.mentees.length}`);

    if (teacher.mentees.length === 0) {
        console.log('No mentees found. Please run restore_mentees.js first.');
        return;
    }

    // 2. Check for Leaves from these mentees
    const leaves = await Leave.find({ student: { $in: teacher.mentees } });
    console.log(`Leaves found for these mentees: ${leaves.length}`);

    // 3. If no leaves, seed one
    if (leaves.length === 0) {
        console.log('Seeding a dummy leave request...');
        await Leave.create({
            type: 'Home Visit',
            startDate: new Date(),
            endDate: new Date(Date.now() + 172800000), // +2 days
            reason: 'Sister wedding ceremony',
            student: teacher.mentees[0], // Assign to first mentee
            status: 'Pending'
        });
        console.log('✅ Created dummy leave request.');
    } else {
        leaves.forEach(l => console.log(`- ${l.type} (${l.status})`));
    }

    mongoose.connection.close();
};

checkLeaves();
