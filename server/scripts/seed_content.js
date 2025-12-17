
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Assignment from '../src/models/Assignment.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedContent = async () => {
    try {
        await connectDB();

        console.log("🧹 Clearing Assignments/Notes...");
        await Assignment.deleteMany({});

        // Fetch all teachers
        const allTeachers = await User.find({ role: 'teacher' });

        // Group teachers by Department
        const teachersByDept = {};
        allTeachers.forEach(t => {
            const dept = t.department || 'CSE';
            if (!teachersByDept[dept]) teachersByDept[dept] = [];
            teachersByDept[dept].push(t);
        });

        console.log("Teachers found per dept:", Object.keys(teachersByDept).map(k => `${k}: ${teachersByDept[k].length}`));

        const content = [];
        const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        const depts = ['CSE', 'IT', 'AIML']; // Enforce these depts

        for (const dept of depts) {
            const deptTeachers = teachersByDept[dept];
            if (!deptTeachers || deptTeachers.length === 0) {
                console.log(`Skipping ${dept} - No teachers found`);
                continue;
            }

            // Distribute assignments among available teachers in the department
            // This ensures variety (Prof A posts Assignment 1, Prof B posts Notes) without duplicates.

            // Subject Mapping for Realism
            const subjectsByYear = {
                'CSE': {
                    '1st Year': { code: 'CS101', name: 'Intro to C Programming' },
                    '2nd Year': { code: 'CS201', name: 'Data Structures & Algo' },
                    '3rd Year': { code: 'CS301', name: 'Operating Systems' },
                    '4th Year': { code: 'CS401', name: 'Cloud Computing' }
                },
                'IT': {
                    '1st Year': { code: 'IT101', name: 'Web Fundamentals' },
                    '2nd Year': { code: 'IT201', name: 'Database Management' },
                    '3rd Year': { code: 'IT301', name: 'Computer Networks' },
                    '4th Year': { code: 'IT401', name: 'Network Security' }
                },
                'AIML': {
                    '1st Year': { code: 'AI101', name: 'Python for Data Science' },
                    '2nd Year': { code: 'AI201', name: 'Statistics & Probability' },
                    '3rd Year': { code: 'AI301', name: 'Machine Learning' },
                    '4th Year': { code: 'AI401', name: 'Deep Learning' }
                }
            };

            let teacherIndex = 0;

            for (const year of years) {
                // Get realistic subject for this year/dept
                const subjectInfo = subjectsByYear[dept] && subjectsByYear[dept][year]
                    ? subjectsByYear[dept][year]
                    : { code: `${dept}101`, name: `${dept} Fundamentals` };

                // Round-robin teacher selection to guarantee distinct teachers (if available)
                const getTeacher = () => {
                    const t = deptTeachers[teacherIndex % deptTeachers.length];
                    teacherIndex++;
                    return t;
                };

                // Assignment 1
                content.push({
                    title: `Assignment: ${subjectInfo.name} - Module 1`,
                    description: `Solve the problems stuck in the module 1 tutorial sheet.`,
                    subject: subjectInfo.name,
                    teacher: getTeacher()._id,
                    department: dept,
                    year: year,
                    batch: '1',
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    type: 'assignment'
                });

                // Project
                content.push({
                    title: `Mini Project: ${subjectInfo.name}`,
                    description: `Implement the concepts discussed in class.`,
                    subject: `${subjectInfo.name} Lab`,
                    teacher: getTeacher()._id,
                    department: dept,
                    year: year,
                    batch: '1',
                    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                    type: 'assignment'
                });

                // Note 1
                content.push({
                    title: `Lecture Slides: ${subjectInfo.name} (Intro)`,
                    description: `Slides covered in the first week.`,
                    subject: subjectInfo.name,
                    teacher: getTeacher()._id,
                    department: dept,
                    year: year,
                    batch: '1',
                    link: 'https://example.com/slides1.pdf',
                    type: 'note'
                });

                // Note 2
                content.push({
                    title: `Reference: ${subjectInfo.name} Cheat Sheet`,
                    description: `Quick reference guide for exam prep.`,
                    subject: subjectInfo.name,
                    teacher: getTeacher()._id,
                    department: dept,
                    year: year,
                    batch: '1',
                    link: 'https://example.com/ref.pdf',
                    type: 'note'
                });
            }
        }

        if (content.length > 0) {
            await Assignment.insertMany(content);
            console.log(`✅ Seeded ${content.length} Assignments/Notes (Unique per Dept).`);
        } else {
            console.log("⚠️ No content seeded. Check if Teachers exist.");
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedContent();
