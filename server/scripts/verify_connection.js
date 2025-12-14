import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';

dotenv.config();

const createVerificationNotice = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        await Notice.create({
            title: "Backend Connection Verified",
            content: "This notice proves that the frontend is successfully fetching data from the MongoDB database. Timestamp: " + new Date().toLocaleTimeString(),
            audience: "teacher",
            // No postedBy needed for it to be visible to teachers generally
        });

        console.log('Verification Notice Created');

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

createVerificationNotice();
