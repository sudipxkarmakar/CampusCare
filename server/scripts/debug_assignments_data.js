
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Assignment from '../src/models/Assignment.js';
import Submission from '../src/models/Submission.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

const debugData = async () => {
    await connectDB();
    try {
        console.log('\n--- USERS (Teachers) ---');
        const teachers = await User.find({ role: 'teacher' }).select('name department email');
        console.table(teachers.map(t => ({ id: t._id.toString(), name: t.name, dept: t.department })));

        console.log('\n--- ASSIGNMENTS ---');
        const assignments = await Assignment.find({}).populate('teacher', 'name');

        // Print detailed table
        const assignTable = assignments.map(a => ({
            ID: a._id.toString(),
            Title: a.title,
            Teacher: a.teacher ? a.teacher.name : 'Unknown',
            Dept: a.department,
            Created: a.createdAt ? a.createdAt.toISOString() : 'N/A'
        }));
        console.table(assignTable);

        console.log('\n--- SUBMISSIONS ---');
        const submissions = await Submission.find({}).populate('student', 'name');

        const subTable = submissions.map(s => ({
            ID: s._id.toString(),
            AssignmentID: s.assignment.toString(),
            Student: s.student ? s.student.name : 'Unknown',
            Link: s.link || 'NO LINK',
            File: s.file || 'N/A'
        }));
        console.table(subTable);

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

debugData();
