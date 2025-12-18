import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

// Setup dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const deleteHODRobust = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error('MONGO_URI not found in .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        // 1. Search by Name
        const usersByName = await User.find({ name: /Test HOD/i });
        console.log(`Found ${usersByName.length} users by name.`);

        // 2. Search by Email pattern
        const usersByEmail = await User.find({ email: /hod_1766010064711@test.com/i });
        console.log(`Found ${usersByEmail.length} users by email pattern.`);

        const allUsers = [...usersByName, ...usersByEmail];

        // Remove duplicates based on _id
        const uniqueUsers = Array.from(new Set(allUsers.map(u => u._id.toString())))
            .map(id => allUsers.find(u => u._id.toString() === id));

        console.log(`Total unique users found to delete: ${uniqueUsers.length}`);

        if (uniqueUsers.length > 0) {
            for (const user of uniqueUsers) {
                console.log(`Deleting User: ID=${user._id}, Name="${user.name}", Email="${user.email}"`);
                await User.deleteOne({ _id: user._id });
                console.log('Deleted.');
            }
        } else {
            console.log('No matching users found to delete.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
};

deleteHODRobust();
