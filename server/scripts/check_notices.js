import mongoose from 'mongoose';
import Notice from '../src/models/Notice.js';

const MONGODB_URI = 'mongodb://localhost:27017/campuscare';

const checkNotices = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const notices = await Notice.find({});
        console.log(`Found ${notices.length} notices:`);
        notices.forEach(n => {
            console.log(`- Title: "${n.title}", Audience: "${n.audience}", Dept: "${n.targetDept || 'None'}"`);
        });

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkNotices();
