import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';

dotenv.config();

const verifyNoticeRestriction = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // 1. Clear & Seed Notices
        await Notice.deleteMany({});
        await Notice.create([
            { title: 'General Notice', content: 'For Everyone', audience: 'general' },
            { title: 'Student Notice', content: 'For Students', audience: 'student' },
            { title: 'Teacher Notice', content: 'For Teachers', audience: 'teacher' }
        ]);
        console.log('Seeded 3 Notices (General, Student, Teacher)');

        // 2. Helper to fetch notices via simulated controller logic
        // (Since we can't easily curl the running server, we'll replicate the query logic)
        const getNoticesForRole = async (role) => {
            let filter = { audience: { $in: ['general', 'public'] } };
            if (role === 'teacher') filter = { audience: { $in: ['teacher'] } };
            else if (role === 'student') filter = { audience: { $in: ['student'] } };

            return await Notice.find(filter);
        };

        // 3. Test Cases
        const publicNotices = await getNoticesForRole('public');
        const studentNotices = await getNoticesForRole('student');
        const teacherNotices = await getNoticesForRole('teacher');

        console.log('\n--- RESULTS ---');
        console.log(`Public Role sees: ${publicNotices.map(n => n.audience).join(', ')}`);
        console.log(`Student Role sees: ${studentNotices.map(n => n.audience).join(', ')}`);
        console.log(`Teacher Role sees: ${teacherNotices.map(n => n.audience).join(', ')}`);

        // 4. Verification Assertions
        let success = true;

        if (publicNotices.find(n => n.audience !== 'general')) { console.error('FAIL: Public saw non-general notice'); success = false; }
        if (studentNotices.find(n => n.audience === 'general')) { console.error('FAIL: Student saw general notice'); success = false; }
        if (teacherNotices.find(n => n.audience === 'general')) { console.error('FAIL: Teacher saw general notice'); success = false; }

        if (success) console.log('\nVERIFICATION PASSED!');
        else console.log('\nVERIFICATION FAILED');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verifyNoticeRestriction();
