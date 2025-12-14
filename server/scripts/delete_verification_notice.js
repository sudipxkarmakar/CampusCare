import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';

dotenv.config();

const deleteVerificationNotice = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const result = await Notice.deleteMany({ title: "Backend Connection Verified" });
        console.log(`Deleted ${result.deletedCount} verification notices.`);

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

deleteVerificationNotice();
