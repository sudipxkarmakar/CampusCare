import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const listNotices = async () => {
    await connectDB();
    try {
        const notices = await Notice.find({});
        console.log(`Found ${notices.length} notices:`);
        notices.forEach(n => {
            console.log(`- [${n.audience}] ${n.title} (By: ${n.postedBy})`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

listNotices();
