import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const verifyFlow = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Get Teacher from IT Dept
        const users = await User.find({ department: 'IT', role: 'teacher' });
        if (users.length === 0) {
            console.log('⚠️ No teachers found in IT Dept. Creating one...');
            const newTeacher = await User.create({
                name: "Test Teacher",
                email: "testteacher@campuscare.local",
                password: "password123",
                role: "teacher",
                department: "IT",
                employeeId: "EMP999"
            });
            users.push(newTeacher);
            console.log('✅ Created Test Teacher');
        }
        const teacher = users[0];
        console.log(`ℹ️ Selected Teacher: ${teacher.name} (${teacher._id})`);

        // 2. Find or Create a Subject
        let subject = await Subject.findOne({ code: 'TEST101', academicYear: '2026' });
        if (!subject) {
            subject = await Subject.create({
                name: "Test Subject",
                code: "TEST101",
                department: "IT",
                year: "4th Year",
                semester: 7, // Number type
                academicYear: "2026"
            });
            console.log('✅ Created Test Subject');
        } else {
            console.log('ℹ️ Found Test Subject');
        }

        // 3. Mimic Assign Request
        // In subjectController.js: assignTeacherToSubject(req, res)
        // It expects req.body: { subjectCode, teacherId, academicYear }

        console.log(`ℹ️ Assigning ${teacher.name} to ${subject.name}...`);

        // We'll perform database operations manually to verify the outcome logic, 
        // effectively mimicking the controller logic to verify schema compatibility.

        if (!subject.teachers.includes(teacher._id)) {
            subject.teachers.push(teacher._id);
            await subject.save();
            console.log('✅ Added teacher ID to Subject.teachers');
        } else {
            console.log('ℹ️ Teacher already assigned to Subject');
        }

        // 4. Verify linking
        const updatedSubject = await Subject.findById(subject._id).populate('teachers');
        console.log('📝 Updated Subject Teachers:', updatedSubject.teachers.map(t => t.name));

        if (updatedSubject.teachers.find(t => t._id.equals(teacher._id))) {
            console.log('Success! Teacher assignment verified at format/DB level.');
        } else {
            console.error('❌ Failed. Teacher not in list.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyFlow();
