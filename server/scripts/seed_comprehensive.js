
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// import bcrypt from 'bcryptjs'; // Removed: Not using bcrypt for now

import User from '../src/models/User.js';
import Notice from '../src/models/Notice.js';
import Complaint from '../src/models/Complaint.js';
import Book from '../src/models/Book.js';
import Alumni from '../src/models/Alumni.js';
import MessMenu from '../src/models/MessMenu.js';
import MarMooc from '../src/models/MarMooc.js';

dotenv.config();

const seed = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected');

        // --- CLEAR EXISTING DATA (Optional, but good for clean slate) ---
        // await User.deleteMany({});
        // await Notice.deleteMany({});
        // await Complaint.deleteMany({});
        // await Book.deleteMany({});
        // await Alumni.deleteMany({});

        console.log('🌱 Seeding Database...');

        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash('password123', salt);
        const hashedPassword = 'password123'; // Storing plain text as per current User model

        // 1. USERS (Min 5 Students, 2 Teachers, 1 Hosteler)
        const students = [];
        for (let i = 1; i <= 5; i++) {
            const roll = `CSE-2025-${String(i).padStart(3, '0')}`;
            let user = await User.findOne({ rollNumber: roll });
            if (!user) {
                user = await User.create({
                    name: `Student ${i}`,
                    email: `student${i}@campus.com`,
                    password: hashedPassword,
                    role: 'student',
                    rollNumber: roll,
                    department: 'CSE',
                    batch: '2025',
                    section: i % 2 === 0 ? 'B' : 'A'
                });
                console.log(`Created Student: ${roll}`);
            }
            students.push(user);
        }

        // Hosteler
        const hostelerRoll = 'CSE-2025-099';
        let hosteler = await User.findOne({ rollNumber: hostelerRoll });
        if (!hosteler) {
            hosteler = await User.create({
                name: 'Hostel Student',
                email: 'hosteler@campus.com',
                password: hashedPassword,
                role: 'hosteler', // effectively student + hostel access
                rollNumber: hostelerRoll,
                department: 'CSE',
                batch: '2025'
            });
            console.log(`Created Hosteler: ${hostelerRoll}`);
        }
        students.push(hosteler);


        // Teachers
        const teachers = [];
        for (let i = 1; i <= 3; i++) {
            const empId = `T-10${i}`;
            let teacher = await User.findOne({ employeeId: empId });
            if (!teacher) {
                teacher = await User.create({
                    name: `Professor ${i}`,
                    email: `prof${i}@campus.com`,
                    password: hashedPassword,
                    role: 'teacher',
                    employeeId: empId,
                    department: 'CSE'
                });
                console.log(`Created Teacher: ${empId}`);
            }
            teachers.push(teacher);
        }

        // 2. NOTICES (Min 5)
        const noticeData = [
            { title: 'Mid-Sem Exam Schedule', content: ' The mid-semester exams will begin from 15th Oct.', audience: 'student' },
            { title: 'Holiday Announcement', content: 'Campus will remain closed on Friday for Gandhi Jayanti.', audience: 'general' },
            { title: 'Library Book Return', content: 'All overdue books must be returned by Monday to avoid fines.', audience: 'student' },
            { title: 'Faculty Meeting', content: 'Department meeting at 3 PM in Conference Hall.', audience: 'teacher' },
            { title: 'Hostel Water Supply', content: 'Water supply maintenance scheduled for tomorrow 10 AM - 2 PM.', audience: 'hosteler' },
            { title: 'Tech Fest Registration', content: 'Register for the annual Tech Fest by this weekend!', audience: 'general' }
        ];

        for (const n of noticeData) {
            const exists = await Notice.findOne({ title: n.title });
            if (!exists) {
                await Notice.create({
                    ...n,
                    postedBy: teachers[0]._id,
                    date: new Date()
                });
                console.log(`Created Notice: ${n.title}`);
            }
        }

        // 3. COMPLAINTS (Min 5, Mixed Statuses)
        const complaintData = [
            { title: 'Fan not working in Room 101', description: 'The ceiling fan makes a loud noise and does not rotate.', category: 'Electrical', priority: 'High', status: 'Submitted', studentIdx: 0 },
            { title: 'Water Cooler Leakage', description: 'Water cooler in the 2nd floor corridor is leaking continuously.', category: 'Plumbing', priority: 'Urgent', status: 'Resolved', studentIdx: 1 },
            { title: 'Broken Window Glass', description: 'Room 205 window glass is broken due to cricket ball.', category: 'Civil', priority: 'Medium', status: 'In Progress', studentIdx: 2 },
            { title: 'Projector Issue in Lab 2', description: 'Projector display is flickering pink.', category: 'IT', priority: 'High', status: 'Submitted', studentIdx: 0 },
            { title: 'Unclean Washrooms', description: '3rd Floor washrooms have not been cleaned for 2 days.', category: 'Sanitation', priority: 'Urgent', status: 'Submitted', studentIdx: 3 },
            { title: 'Library WiFi very slow', description: 'Cannot access research papers due to slow speed.', category: 'IT', priority: 'Medium', status: 'Resolved', studentIdx: 4 }
        ];

        for (const c of complaintData) {
            const exists = await Complaint.findOne({ title: c.title });
            if (!exists) {
                await Complaint.create({
                    title: c.title,
                    description: c.description,
                    category: c.category,
                    priority: c.priority,
                    status: c.status,
                    student: students[c.studentIdx]._id,
                    upvotes: Math.floor(Math.random() * 20)
                });
                console.log(`Created Complaint: ${c.title} [${c.status}]`);
            }
        }

        // 4. BOOKS (Min 5)
        const booksData = [
            { title: 'Clean Architecture', author: 'Robert C. Martin', isbn: '978-0134494166', location: 'Row 1' },
            { title: 'Introduction to Algorithms', author: 'Cormen, Leiserson', isbn: '978-0262033848', location: 'Row 2' },
            { title: 'The Pragmatic Programmer', author: 'Andy Hunt', isbn: '978-0201616224', location: 'Row 1' },
            { title: 'Design Patterns', author: 'Erich Gamma', isbn: '978-0201633610', location: 'Row 3' },
            { title: 'You Don\'t Know JS', author: 'Kyle Simpson', isbn: '978-1491904244', location: 'Row 4' }
        ];

        for (const b of booksData) {
            const exists = await Book.findOne({ isbn: b.isbn });
            if (!exists) {
                await Book.create(b);
                console.log(`Created Book: ${b.title}`);
            }
        }

        // 5. ALUMNI (Min 5)
        const alumniData = [
            { name: 'Rohan Gupta', company: 'Google', role: 'Software Engineer', gradYear: 2020 },
            { name: 'Priya Singh', company: 'Amazon', role: 'Data Scientist', gradYear: 2019 },
            { name: 'Amit Verma', company: 'EdTech Startup', role: 'Founder', gradYear: 2018 },
            { name: 'Sneha Reddy', company: 'Microsoft', role: 'Product Manager', gradYear: 2021 },
            { name: 'Vikram Malhotra', company: 'Tesla', role: 'AI Engineer', gradYear: 2019 }
        ];

        for (let i = 0; i < alumniData.length; i++) {
            const data = alumniData[i];
            const email = `alumni${i}@campus.com`;
            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    name: data.name,
                    email: email,
                    password: hashedPassword,
                    role: 'alumni',
                    department: 'CSE'
                });
            }

            const alumniProfile = await Alumni.findOne({ user: user._id });
            if (!alumniProfile) {
                await Alumni.create({
                    user: user._id,
                    graduationYear: data.gradYear,
                    degree: 'B.Tech',
                    department: 'CSE',
                    currentCompany: data.company,
                    jobTitle: data.role,
                    linkedinProfile: 'https://linkedin.com/in/example',
                    about: `Working at ${data.company} as ${data.role}`
                });
                console.log(`Created Alumni: ${data.name}`);
            }
        }

        console.log('✅ Seeding Completed Successfully.');
        process.exit();
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seed();
