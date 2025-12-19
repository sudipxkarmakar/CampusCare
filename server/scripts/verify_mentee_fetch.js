// import fetch from 'node-fetch'; // Native fetch in Node 22
import User from '../src/models/User.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Find a Teacher
        const teacher = await User.findOne({ role: 'teacher' });
        if (!teacher) {
            console.log('No teacher found');
            process.exit(1);
        }

        // 2. Generate Token
        const token = jwt.sign({ id: teacher._id }, JWT_SECRET, { expiresIn: '30d' });
        console.log(`Testing using Teacher: ${teacher.name}`);

        // 3. Hit Endpoint
        const response = await fetch('http://localhost:5000/api/mar-moocs/mentees', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Success! Status:', response.status);
            console.log('Items:', data.length);
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log('Failed! Status:', response.status);
            const text = await response.text();
            console.log('Body:', text);
        }

        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verify();
