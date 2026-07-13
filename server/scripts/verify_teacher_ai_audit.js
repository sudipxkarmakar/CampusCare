import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processAIInput } from '../src/ai/index.js';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const cases = [
    ['Open attendance', r => r.action === 'NAVIGATE' || r.semanticType === 'NAVIGATION'],
    ['Open students', r => r.action === 'NAVIGATE' || r.semanticType === 'NAVIGATION'],
    ['Open dashboard', r => r.action === 'NAVIGATE' || r.semanticType === 'NAVIGATION'],
    ['Open reports', r => r.action === 'NAVIGATE' || r.semanticType === 'NAVIGATION'],
    ['How many assignments do I have?', r => r.semanticType === 'ASSIGNMENT_ANALYTICS' && r.payload?.stats],
    ['How many students are low attendance?', r => r.semanticType === 'STUDENT_ANALYTICS' && r.payload?.stats],
    ['Pending complaints analytics', r => r.semanticType === 'COMPLAINT_ANALYTICS' && r.payload?.stats],
    ['Pending leave requests', r => r.semanticType === 'LEAVE_ANALYTICS' && r.payload?.stats],
    ['Today timetable', r => r.semanticType === 'SCHEDULE_VIEW'],
    ['Who teaches CS?', r => ['COLLECTION_VIEW', 'TEACHER_EMPTY', 'TEACHER'].includes(r.semanticType) || r.entityType === 'TEACHER'],
    ['Who is my HOD?', r => r.semanticType === 'HOD_LOOKUP' || r.semanticType === 'TEACHER_EMPTY'],
    ['What should I finish today?', r => r.semanticType === 'TEACHER_RECOMMENDATION'],
    ['Delete students', r => r.success === false && r.semanticType === 'POLICY_DENIAL'],
    ['Create DBMS assignment for 3rd semester due 2026-08-01 for 20 marks', r => r.action === 'AI_DRAFT_REDIRECT'],
    ['Tomorrow there will be no lab. Create notice', r => r.action === 'AI_DRAFT_REDIRECT']
];

const run = async () => {
    await connectDB();
    const teacher = await User.findOne({ role: 'teacher' }).lean();
    if (!teacher) throw new Error('No teacher user exists in the database.');

    let passed = 0;
    for (let i = 0; i < cases.length; i++) {
        const [input, assert] = cases[i];
        const response = await processAIInput(input, teacher, `teacher-audit-${i}`, { dayIndex: 0, isoDate: '2026-07-13' });
        const ok = Boolean(assert(response));
        if (ok) passed++;
        console.log(`${ok ? 'PASS' : 'FAIL'} ${input}`);
        console.log(`  semantic=${response.semanticType || '-'} action=${response.action || '-'} state=${response.presentationState || '-'}`);
        if (!ok) console.log(`  message=${response.message}`);
    }

    console.log(`\nTeacher AI audit: ${passed}/${cases.length} passed`);
    if (passed !== cases.length) process.exitCode = 1;
    await mongoose.disconnect();
};

run().catch(async error => {
    console.error(error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
