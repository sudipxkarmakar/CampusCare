import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- Name: ${u.name}, Role: ${u.role}, Email: ${u.email}`);
            if (u.role === 'student') console.log(`  RollNo: ${u.rollNumber}, Dept: ${u.department}`);
            if (u.role === 'teacher') console.log(`  EmpID: ${u.employeeId}, Dept: ${u.department}`);
            if (u.role === 'hosteler') console.log(`  RollNo: ${u.rollNumber}, Hostel: ${u.hostelName}`);
            console.log(`  Password: ${u.password}`); // Checking plain text
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

listUsers();
