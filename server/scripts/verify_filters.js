
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Notice from '../src/models/Notice.js';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_URL = 'http://localhost:5000/api';
const logFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'filter_log.txt');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function runTest() {
    fs.writeFileSync(logFile, "Starting Verification...\n");
    log(`CWD: ${process.cwd()}`);
    log(`Env Path: ${envPath}`);
    log('Starting Filter Verification...');

    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI not found in env");
        }

        // 1. Connect DB
        await mongoose.connect(process.env.MONGODB_URI);
        log("DB Connected");

        // 3. Login as HOD
        const hodRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: 'EMP-HOD-IT', password: 'password123' })
        });

        let hodData = await hodRes.json();

        if (!hodData.token) {
            log("HOD Login failed, attempting quick register token gen...");
            const user = await User.findOne({ role: 'hod', department: 'IT' });
            if (user) {
                const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
                hodData = { token, user, _id: user._id };
                log("Generated token manually");
            } else {
                throw new Error("No HOD IT found in DB. Please ensure HOD exists.");
            }
        }

        log("HOD Logged In");
        const token = hodData.token;
        const userId = hodData._id || hodData.user._id;

        // 4. Post 4 Types of Notices
        const notices = [
            { title: "Test General", content: "General Content", audience: "general" },
            { title: "Test Dept Everyone", content: "Dept Content", audience: "general", targetDept: "IT" },
            { title: "Test Teachers", content: "Teacher Content", audience: "teacher", targetDept: "IT" },
            { title: "Test Students", content: "Student Content", audience: "student", targetDept: "IT" }
        ];

        for (const n of notices) {
            await fetch(`${API_URL}/notices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...n, userId, role: 'hod' })
            });
        }
        log("Posted 4 Test Notices");

        // 5. Fetch Notices as HOD
        const fetchRes = await fetch(`${API_URL}/notices?role=hod&userId=${userId}&department=IT`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const fetchedNotices = await fetchRes.json();
        log(`Fetched ${fetchedNotices.length} notices total`);

        // 6. Simulate Client-Side Filtering Logic matches `hod/notices.html`
        function mockFilter(type, list) {
            return list.filter(notice => {
                const audience = notice.audience;
                const targetDept = notice.targetDept;

                if (type === 'all') return true;
                if (type === 'general') return audience === 'general' && !targetDept;
                if (type === 'teacher') return audience === 'teacher' || (audience === 'general' && targetDept);
                if (type === 'student') return audience === 'student' || (audience === 'general' && targetDept);
                return true;
            });
        }

        const all = mockFilter('all', fetchedNotices);
        const general = mockFilter('general', fetchedNotices);
        const teachers = mockFilter('teacher', fetchedNotices);
        const students = mockFilter('student', fetchedNotices);

        log(`Filter 'All': ${all.length}`);
        log(`Filter 'General': ${general.length}`);
        log(`Filter 'Teacher': ${teachers.length}`);
        log(`Filter 'Student': ${students.length}`);

        const hasTeacherSpecific = teachers.find(n => n.title === "Test Teachers");
        const hasDeptGeneralInTeachers = teachers.find(n => n.title === "Test Dept Everyone");
        const hasStudentSpecific = students.find(n => n.title === "Test Students");

        if (hasTeacherSpecific && hasDeptGeneralInTeachers && hasStudentSpecific) {
            log("PASS: Filter Logic correct");
        } else {
            log("FAIL: Filter Logic incorrect");
        }

    } catch (e) {
        log(`ERROR: ${e.message}`);
        console.error(e);
    } finally {
        setTimeout(() => process.exit(0), 1000);
    }
}

runTest();
