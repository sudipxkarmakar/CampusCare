
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const testRoute = async () => {
    await connectDB();

    try {
        // Find a teacher
        const teacher = await User.findOne({ role: 'teacher' });
        if (!teacher) {
            console.log('No teacher found in DB');
            process.exit(1);
        }
        console.log(`Testing with teacher: ${teacher.name} (${teacher._id})`);

        // Generate Token
        const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        // Test API
        const url = 'http://localhost:5000/api/content/assignment/created';
        console.log(`Fetching: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('Success! Data received:', data.length, 'items');
            console.log(JSON.stringify(data.slice(0, 1), null, 2)); // Show first item
        } else {
            const text = await response.text();
            console.log('Error Body:', text);
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        mongoose.connection.close();
    }
};

testRoute();
