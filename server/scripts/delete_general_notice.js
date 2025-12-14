import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';

dotenv.config();

const deleteGeneralNotice = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Delete notices with the exact title "General Notice"
        const result = await Notice.deleteMany({ title: "General Notice" });
        console.log(`Deleted ${result.deletedCount} notices with title 'General Notice'.`);

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

deleteGeneralNotice();
