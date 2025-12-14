import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';

dotenv.config();

const deleteTeacherNotice = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Delete notices with the exact title "Teacher Notice"
        const result = await Notice.deleteMany({ title: "Teacher Notice" });
        console.log(`Deleted ${result.deletedCount} notices with title 'Teacher Notice'.`);

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

deleteTeacherNotice();
