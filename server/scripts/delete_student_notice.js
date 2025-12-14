import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';

dotenv.config();

const deleteStudentNotice = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Delete notices with the exact title "Student Notice"
        const result = await Notice.deleteMany({ title: "Student Notice" });
        console.log(`Deleted ${result.deletedCount} notices with title 'Student Notice'.`);

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

deleteStudentNotice();
