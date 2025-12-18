
import mongoose from 'mongoose';
import Notice from '../src/models/Notice.js';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not found in env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const audienceList = ['student', 'hosteler', 'general', 'teacher'];
        const query = {
            audience: { $in: audienceList }
        };

        const notices = await Notice.find(query).sort({ date: -1 }).limit(50);
        console.log('--- Query Result for Warden ---');
        console.log('Total:', notices.length);

        const teachers = notices.filter(n => n.audience === 'teacher');
        console.log('Teacher Notices:', teachers.length);

        teachers.forEach(t => {
            console.log('Notice:', t.title, '| Audience:', t.audience);
        });

        const hods = notices.filter(n => n.audience === 'hod');
        console.log('HOD Notices (if any):', hods.length);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
