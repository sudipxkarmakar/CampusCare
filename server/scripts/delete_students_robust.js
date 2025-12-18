import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

// Setup dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const deleteStudentsRobust = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        const targetEmails = [
            'TEST_1765986401160@test.com',
            'student_1766010064711@test.com'
        ];

        for (const email of targetEmails) {
            const user = await User.findOne({ email });
            if (user) {
                console.log(`Found User: ID=${user._id}, Name="${user.name}", Email="${user.email}"`);
                await User.deleteOne({ _id: user._id });
                console.log('Deleted successfully.');
            } else {
                console.log(`User with email ${email} not found.`);
            }
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
};

deleteStudentsRobust();
