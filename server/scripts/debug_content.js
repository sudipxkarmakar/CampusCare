
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Assignment from '../src/models/Assignment.js';
import Note from '../src/models/Note.js';
import Submission from '../src/models/Submission.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const debugContent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find a student
        const student = await User.findOne({ role: 'student' });
        if (!student) {
            console.log('No student found');
            process.exit(0);
        }

        console.log('Testing for Student:', student.name, student.email);
        console.log('Student Details:', {
            dept: student.department,
            year: student.year,
            batch: student.batch,
            subBatch: student.subBatch,
            section: student.section
        });

        const { department, year, batch, subBatch, section } = student;

        let assignmentQuery = {
            department: department,
            year: year,
            $or: [
                { batch: batch },
                { batch: 'All' }
            ]
        };

        if (section) {
            assignmentQuery.$and = [
                {
                    $or: [
                        { section: section },
                        { section: { $exists: false } },
                        { section: null }
                    ]
                }
            ];
        }

        console.log('Assignment Query:', JSON.stringify(assignmentQuery, null, 2));

        const assignmentsData = await Assignment.find(assignmentQuery)
            .sort({ createdAt: -1 })
            .populate('teacher', 'name email');

        console.log(`Found ${assignmentsData.length} assignments`);
        if (assignmentsData.length > 0) {
            console.log('First Assignment:', assignmentsData[0].title);
        }

        const notes = await Note.find({
            department: department,
            year: year,
            $or: [
                { batch: batch, subBatch: { $exists: false } },
                { batch: batch, subBatch: null },
                { batch: batch, subBatch: subBatch }
            ]
        }).sort({ createdAt: -1 });

        console.log(`Found ${notes.length} notes`);

    } catch (error) {
        console.error('Error in debug script:', error);
    } finally {
        await mongoose.disconnect();
    }
};

debugContent();
