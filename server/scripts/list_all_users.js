import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('📋 Fetching all users...');
        const users = await User.find({});

        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log('---');
            console.log(`ID: ${u._id}`);
            console.log(`Name: ${u.name}`);
            console.log(`Email: ${u.email}`);
            console.log(`Role: ${u.role}`);
            console.log(`RollNo: ${u.rollNumber}`);
            console.log(`EmpID: ${u.employeeId}`);
            console.log(`Dept: ${u.department}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

listUsers();
