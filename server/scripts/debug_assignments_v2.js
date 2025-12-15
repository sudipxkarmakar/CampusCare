import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assignment from '../src/models/Assignment.js';
import User from '../src/models/User.js';
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

const checkAssignments = async () => {
    await connectDB();

    const teacherId = '693ee7d950f41a5f5e8117ea'; // Teacher 'shubh'

    try {
        const teacher = await User.findById(teacherId);
        if (teacher) {
            console.log(`Teacher: ${teacher.name} (Dept: ${teacher.department})`);
        } else {
            console.log('Teacher not found!');
        }

        const assignments = await Assignment.find({ teacher: teacherId });
        console.log(`\nAssignments found for this teacher: ${assignments.length}`);
        assignments.forEach(a => console.log(`- ${a.title} (Dept: ${a.department})`));

        if (assignments.length === 0) {
            console.log('Creating a dummy assignment for debugging...');
            await Assignment.create({
                title: 'Test Assignment (Restored)',
                type: 'assignment',
                subject: 'Debug Subject',
                teacher: teacherId,
                department: teacher.department || 'CSE',
                batch: '2025',
                deadline: new Date(Date.now() + 86400000)
            });
            console.log('✅ Created dummy assignment.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

checkAssignments();
