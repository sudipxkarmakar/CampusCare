
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

        const notices = await Notice.find({});
        console.log('Total Notices:', notices.length);

        console.log('--- Notices ---');
        notices.forEach(n => {
            console.log(`Title: "${n.title}", Audience: '${n.audience}', Dept: '${n.targetDept || 'N/A'}'`);
        });

        const teacherNotices = notices.filter(n => n.audience === 'teacher');
        console.log('--- Teacher Notices Count ---', teacherNotices.length);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
