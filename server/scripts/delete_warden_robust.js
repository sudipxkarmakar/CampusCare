import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

// Setup dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const deleteWardenRobust = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        // Search by Email (Exact match from screenshot)
        const targetEmail = 'warden_notice_1766054756977@test.com';
        const usersByEmail = await User.find({ email: targetEmail });
        console.log(`Found ${usersByEmail.length} users by email: ${targetEmail}`);

        if (usersByEmail.length > 0) {
            for (const user of usersByEmail) {
                console.log(`Deleting User: ID=${user._id}, Name="${user.name}", Role="${user.role}"`);
                await User.deleteOne({ _id: user._id });
                console.log('Deleted successfully.');
            }
        } else {
            console.log('No matching warden found to delete.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
};

deleteWardenRobust();
