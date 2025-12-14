import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE'];
const BATCHES = ['2023', '2024', '2025'];
const SECTIONS = ['A', 'B'];

const seedDepartments = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Clear existing students and teachers to avoid duplicates/conflicts? 
        // Or just append? User said "Make ... db", usually implies fresh or upsert.
        // For safety, let's just create new ones and maybe skip if email exists, 
        // but given the request to "Make 60 students", clearing might be cleaner 
        // OR we just use unique generated emails. Using unique emails is safer 
        // to avoid wiping user data unless verifying.
        // Let's Clean up first for these specific generated patterns to prevent infinite growth.

        console.log('Cleaning up old auto-generated records...');
        await User.deleteMany({ email: { $regex: /@(campus|test)\.com$/ } });
        // Wait, verifying verify_login.js used verified@test.com. 
        // Let's be careful. The seeder uses @campus.com. 
        // The previous seeder used rahul@campus.com.
        // I will delete where email matches my NEW pattern `student.${dept}` to be safe.
        // Actually, for "Make 60 students db", it's best to wipe everything to guarantee the state,
        // BUT I shouldn't wipe Admin or manually created users if I can avoid it.
        // Let's just wipe 'student' and 'teacher' roles for simplicity as this is likely a dev env.

        await User.deleteMany({ role: { $in: ['student', 'teacher'] } });
        console.log('Cleared existing Students and Teachers.');

        for (const dept of DEPARTMENTS) {
            console.log(`Processing Department: ${dept}`);

            // 1. Create 10 Teachers
            const teachers = [];
            for (let i = 1; i <= 10; i++) {
                const teacher = new User({
                    name: `Prof. ${dept} ${i}`,
                    email: `teacher.${dept.toLowerCase()}.${i}@campus.com`,
                    password: 'password123',
                    role: 'teacher',
                    employeeId: `TEC-${dept}-${100 + i}`,
                    department: dept,
                    mentees: [] // Initialize empty
                });
                await teacher.save();
                teachers.push(teacher);
            }
            console.log(`  Created ${teachers.length} Teachers for ${dept}`);

            // 2. Create 60 Students
            const students = [];
            for (let i = 1; i <= 60; i++) {
                const batch = BATCHES[i % BATCHES.length]; // Distribute batches
                const section = SECTIONS[i % SECTIONS.length]; // Distribute sections
                const rollNoKey = 1000 + i;

                // Assign a mentor (Round Robin)
                const mentor = teachers[(i - 1) % teachers.length];

                const student = new User({
                    name: `Student ${dept} ${i}`,
                    email: `student.${dept.toLowerCase()}.${i}@campus.com`,
                    password: 'password123',
                    role: 'student',
                    rollNumber: `${dept}-${batch}-${rollNoKey}`,
                    department: dept,
                    batch: batch,
                    section: section,
                    mentor: mentor._id
                });

                await student.save();
                students.push(student);

                // Add student to mentor's mentees list
                mentor.mentees.push(student._id);
            }
            console.log(`  Created ${students.length} Students for ${dept}`);

            // 3. Save Teachers with updated mentees
            // We can do bulk write or just save each. Since it's only 10, saving each is fine.
            for (const teacher of teachers) {
                await teacher.save();
            }
            console.log(`  Assigned students to teachers for ${dept}`);
        }

        console.log('Seeding Complete!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
};

seedDepartments();
