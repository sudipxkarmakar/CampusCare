import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Notice from '../src/models/Notice.js';
import User from '../src/models/User.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyNotices = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Cleanup old test notices
        await Notice.deleteMany({ title: /TEST NOTICE/ });
        console.log('🧹 Cleaned up old test notices');

        // 2. Create Test Notices for each Audience
        const notices = [
            { title: 'TEST NOTICE: General', content: 'For Everyone', audience: 'general' },
            { title: 'TEST NOTICE: Student', content: 'For Students Only', audience: 'student' },
            { title: 'TEST NOTICE: Teacher', content: 'For Teachers Only', audience: 'teacher' },
            { title: 'TEST NOTICE: Hosteler', content: 'For Hostelers Only', audience: 'hosteler' }
        ];

        await Notice.insertMany(notices);
        console.log('📝 Created 4 Test Notices (General, Student, Teacher, Hosteler)');

        // 3. Define Helper to simulate fetching
        const fetchForRole = async (role) => {
            let filter = { audience: 'general' };
            if (role === 'teacher') filter = { audience: { $in: ['general', 'teacher'] } };
            if (role === 'student') filter = { audience: { $in: ['general', 'student'] } };
            if (role === 'hosteler') filter = { audience: { $in: ['general', 'student', 'hosteler'] } };

            const results = await Notice.find(filter);
            const titles = results.map(n => n.title.replace('TEST NOTICE: ', ''));
            return titles;
        };

        // 4. Verify each role
        console.log('\n--- VERIFICATION RESULTS ---');

        // PUBLIC / GENERAL
        const publicView = await fetchForRole('public');
        console.log(`\n👁️  Public View: [${publicView.join(', ')}]`);
        if (publicView.includes('General') && !publicView.includes('Student')) console.log('✅ Public Check PASSED');
        else console.log('❌ Public Check FAILED');

        // TEACHER
        const teacherView = await fetchForRole('teacher');
        console.log(`\n👨‍🏫 Teacher View: [${teacherView.join(', ')}]`);
        if (teacherView.includes('Teacher') && !teacherView.includes('Student')) console.log('✅ Teacher Check PASSED');
        else console.log('❌ Teacher Check FAILED');

        // STUDENT
        const studentView = await fetchForRole('student');
        console.log(`\n🎓 Student View: [${studentView.join(', ')}]`);
        if (studentView.includes('Student') && !studentView.includes('Teacher')) console.log('✅ Student Check PASSED');
        else console.log('❌ Student Check FAILED');

        // HOSTELER
        const hostelerView = await fetchForRole('hosteler');
        console.log(`\n🏠 Hosteler View: [${hostelerView.join(', ')}]`);
        if (hostelerView.includes('Hosteler') && hostelerView.includes('Student') && !hostelerView.includes('Teacher')) console.log('✅ Hosteler Check PASSED');
        else console.log('❌ Hosteler Check FAILED');

        console.log('\n----------------------------');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

verifyNotices();
