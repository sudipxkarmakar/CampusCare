import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Notice from '../src/models/Notice.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const debugSystem = async () => {
    await connectDB();

    console.log('\n--- USERS ---');
    const teachers = await User.find({ role: 'teacher' });
    console.log(`Teachers Found: ${teachers.length}`);
    teachers.forEach(t => console.log(`- ${t.name} (Dept: ${t.department}) ID: ${t._id}`));

    const students = await User.find({ role: 'student' });
    console.log(`Students Found: ${students.length}`);
    students.forEach(s => console.log(`- ${s.name} (Dept: ${s.department})`));

    console.log('\n--- NOTICES ---');
    const notices = await Notice.find({});
    console.log(`Notices Found: ${notices.length}`);
    notices.forEach(n => console.log(`- [${n.audience}] ${n.title} (PostedBy: ${n.postedBy})`));

    mongoose.connection.close();
};

debugSystem();
