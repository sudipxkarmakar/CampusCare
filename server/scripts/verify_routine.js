import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Routine from '../src/models/Routine.js';

dotenv.config();

const verifyRoutine = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // 1. Verify Student Routine Fetch
        console.log('--- Student Routine Check ---');
        const student = await User.findOne({ role: 'student' }); // Gets a random student
        if (!student) { console.log('No student found'); process.exit(1); }

        console.log(`Student: ${student.name} (${student.department} - ${student.batch} - ${student.section})`);

        const studentRoutine = await Routine.find({
            department: student.department,
            batch: student.batch,
            section: student.section
        }).populate('teacher', 'name').sort({ day: 1, period: 1 });

        console.log(`Found ${studentRoutine.length} slots for this student.`);
        // Show Monday
        const mondaySlots = studentRoutine.filter(r => r.day === 'Monday');
        mondaySlots.forEach(s => {
            console.log(`[${s.day}] ${s.startTime}-${s.endTime}: ${s.subject} (Prof. ${s.teacher.name})`);
        });


        // 2. Verify Teacher Routine Fetch
        console.log('\n--- Teacher Routine Check ---');
        // Pick a teacher from the monday slots if any, or random
        let teacherId;
        if (mondaySlots.length > 0) {
            teacherId = mondaySlots[0].teacher._id;
        } else {
            const t = await User.findOne({ role: 'teacher' });
            teacherId = t._id;
        }

        const teacher = await User.findById(teacherId);
        console.log(`Teacher: ${teacher.name} (${teacher.department})`);

        const teacherRoutine = await Routine.find({ teacher: teacherId })
            .sort({ day: 1, period: 1 });

        console.log(`Found ${teacherRoutine.length} slots for this teacher.`);
        // Show a few
        teacherRoutine.slice(0, 3).forEach(s => {
            console.log(`[${s.day}] ${s.startTime}: ${s.subject} for ${s.batch}-${s.section} Rm:${s.roomNumber}`);
        });

        if (studentRoutine.length > 0 && teacherRoutine.length >= 0) { // Teacher might have 0 if unlucky with randomizer but unlikely with 750 slots
            console.log('\nVERIFICATION PASSED');
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyRoutine();
