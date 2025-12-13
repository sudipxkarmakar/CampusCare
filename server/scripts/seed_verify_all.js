import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import all models
import User from '../src/models/User.js';
import Leave from '../src/models/Leave.js';
import Complaint from '../src/models/Complaint.js';
import Assignment from '../src/models/Assignment.js';
import Notice from '../src/models/Notice.js';
import Alumni from '../src/models/Alumni.js';
import Book from '../src/models/Book.js';
import LibraryTransaction from '../src/models/LibraryTransaction.js';
import Document from '../src/models/Document.js';
import Routine from '../src/models/Routine.js';
import MarMooc from '../src/models/MarMooc.js';
import Note from '../src/models/Note.js';
import MessMenu from '../src/models/MessMenu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const runVerification = async () => {
    try {
        console.log('🔌 Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ Connected to ${mongoose.connection.host}`);

        // Clean up test data (optional: be careful in prod, but safe for dev)
        // await mongoose.connection.db.dropDatabase(); // Uncomment to wipe clean

        console.log('\n--- 1. Creating Users ---');
        // Student
        const student = await User.create({
            name: 'Test Student',
            email: `student_${Date.now()}@test.com`,
            password: 'hashedpassword',
            role: 'student',
            rollNumber: `CSE-2025-${Math.floor(Math.random() * 1000)}`,
            batch: '2025',
            section: 'A'
        });
        console.log('✅ Student Created:', student._id);

        // Teacher
        const teacher = await User.create({
            name: 'Test Teacher',
            email: `teacher_${Date.now()}@test.com`,
            password: 'hashedpassword',
            role: 'teacher',
            employeeId: `EMP-${Math.floor(Math.random() * 1000)}`,
            department: 'CSE'
        });
        console.log('✅ Teacher Created:', teacher._id);

        console.log('\n--- 2. Creating Dependent Records ---');

        // Leave
        const leave = await Leave.create({
            student: student._id,
            type: 'Medical',
            startDate: new Date(),
            endDate: new Date(),
            reason: 'Fever'
        });
        console.log('✅ Leave Application Created:', leave._id);

        // Complaint
        const complaint = await Complaint.create({
            title: 'Water Issue',
            description: 'No water in cooler',
            student: student._id,
            category: 'Sanitation'
        });
        console.log('✅ Complaint Created:', complaint._id);

        // Assignment
        const assignment = await Assignment.create({
            title: 'Algorithm Assignment',
            description: 'Solve first 10 problems',
            subject: 'Algorithms',
            teacher: teacher._id,
            department: 'CSE',
            batch: '2025',
            deadline: new Date(Date.now() + 86400000)
        });
        console.log('✅ Assignment Created:', assignment._id);

        // Notice
        const notice = await Notice.create({
            title: 'Holiday Notice',
            content: 'College closed tomorrow',
            postedBy: teacher._id
        });
        console.log('✅ Notice Created:', notice._id);

        // Alumni
        const alumniUser = await User.create({
            name: 'Test Alumni',
            email: `alumni_${Date.now()}@test.com`,
            password: 'hashedpassword',
            role: 'alumni'
        });
        const alumni = await Alumni.create({
            user: alumniUser._id,
            graduationYear: 2024,
            degree: 'B.Tech',
            department: 'CSE',
            currentCompany: 'Google'
        });
        console.log('✅ Alumni Profile Created:', alumni._id);

        // Library (Book & Transaction)
        const book = await Book.create({
            title: 'Introduction to Algorithms',
            author: 'Cormen',
            isbn: `978-000000${Math.floor(Math.random() * 1000)}`,
            totalCopies: 5
        });
        console.log('✅ Book Created:', book._id);

        const libTrans = await LibraryTransaction.create({
            book: book._id,
            user: student._id,
            dueDate: new Date(Date.now() + 7 * 86400000)
        });
        console.log('✅ Library Transaction Created:', libTrans._id);

        // Document
        const doc = await Document.create({
            user: student._id,
            title: 'Sem 1 Marksheet',
            type: 'Marksheet',
            fileUrl: 'http://example.com/mark1.pdf'
        });
        console.log('✅ Document Created:', doc._id);

        // Routine
        const routine = await Routine.create({
            day: 'Monday',
            period: 1,
            subject: 'Math',
            teacher: teacher._id,
            batch: '2025',
            department: 'CSE'
        });
        console.log('✅ Routine Created:', routine._id);

        // MarMooc
        const mar = await MarMooc.create({
            student: student._id,
            title: 'Python Course',
            platform: 'Coursera'
        });
        console.log('✅ MarMooc Created:', mar._id);

        // Note
        const note = await Note.create({
            subject: 'OS',
            topic: 'Process Management',
            uploadedBy: teacher._id,
            fileUrl: 'http://example.com/notes.pdf',
            department: 'CSE'
        });
        console.log('✅ Note Created:', note._id);

        // Mess Menu
        // Check if Monday exists first to avoid dup key error if running multiple times without drop
        const existingMenu = await MessMenu.findOne({ day: 'Monday' });
        if (!existingMenu) {
            const menu = await MessMenu.create({
                day: 'Monday',
                breakfast: 'Poha',
                lunch: 'Rice/Dal',
                snacks: 'Samosa',
                dinner: 'Roti/Sabzi'
            });
            console.log('✅ MessMenu Created:', menu._id);
        } else {
            console.log('ℹ️ MessMenu for Monday already exists.');
        }

        console.log('\n🎉 ALL MODULES VERIFIED SUCCESSFULLY!');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED');
        console.error(error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected.');
    }
};

runVerification();
