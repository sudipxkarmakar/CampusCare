import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assignment from '../src/models/Assignment.js';
import User from '../src/models/User.js';

dotenv.config();

const seedPendingAssignments = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // 1. Find a target student (e.g., from CSE)
        const student = await User.findOne({ role: 'student', department: 'CSE', section: 'A' });
        if (!student) {
            console.error('No suitable student found to verify against.');
            process.exit(1);
        }
        console.log(`Targeting Student: ${student.name} (${student.department} - ${student.batch} - ${student.section})`);

        // 2. Clear old assignments for this specific batch/section to allow clean counting
        await Assignment.deleteMany({ department: 'CSE', batch: student.batch, section: 'A' });

        // 3. Create Assignments
        const teacher = await User.findOne({ role: 'teacher' });
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7); // 1 week from now

        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 7); // 1 week ago

        await Assignment.insertMany([
            {
                title: 'Future Assignment 1', description: 'Test', subject: 'Test',
                department: 'CSE', batch: student.batch, section: 'A',
                deadline: futureDate, teacher: teacher._id
            },
            {
                title: 'Future Assignment 2', description: 'Test', subject: 'Test',
                department: 'CSE', batch: student.batch, section: 'A',
                deadline: futureDate, teacher: teacher._id
            },
            {
                title: 'Future Assignment 3', description: 'Test', subject: 'Test',
                department: 'CSE', batch: student.batch, section: 'A',
                deadline: futureDate, teacher: teacher._id
            },
            {
                title: 'Past Assignment 1', description: 'Test', subject: 'Test',
                department: 'CSE', batch: student.batch, section: 'A',
                deadline: pastDate, teacher: teacher._id
            }
        ]);

        console.log('Seeded 3 Future Assignments and 1 Past Assignment.');

        // 4. Verification Logic (Simulate Frontend)
        const assignments = await Assignment.find({
            department: 'CSE',
            batch: student.batch,
            $or: [{ section: 'A' }, { section: null }]
        });

        const pendingCount = assignments.filter(a => new Date(a.deadline) > new Date()).length;
        console.log(`\nSimulated Frontend Calculation: ${pendingCount} Pending Assignments.`);

        assignments.forEach(a => {
            console.log(` - ${a.title} (Due: ${a.deadline}, Sec: ${a.section})`);
        });

        if (pendingCount >= 3) {
            console.log('VERIFICATION PASSED: Count includes newly seeded assignments + existing ones.');
        } else {
            console.error(`VERIFICATION FAILED: Expected at least 3, got ${pendingCount}`);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedPendingAssignments();
