
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import fetch from 'node-fetch';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const debugApi = async () => {
    try {
        // 1. Connect to DB to get a real HOD user
        await mongoose.connect(process.env.MONGO_URI);
        const hod = await User.findOne({ role: 'hod', department: 'IT' });

        if (!hod) {
            console.log('No HOD user found in DB.');
            await mongoose.disconnect();
            return;
        }

        console.log(`Found HOD: ${hod.name} (${hod.email})`);

        // 2. Generate Token
        const token = jwt.sign({ id: hod._id, role: hod.role }, process.env.JWT_SECRET, {
            expiresIn: '1d'
        });

        // 3. Call API
        const response = await fetch('http://localhost:5000/api/hod/students', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.log(`API Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log(text);
        } else {
            const students = await response.json();
            console.log(`API returned ${students.length} students.`);
            if (students.length > 0) {
                const s = students[0];
                console.log('--- Sample Student from API ---');
                console.log('Name:', s.name);
                console.log('Department:', s.department);     // EXPECTED: value (not undefined)
                console.log('BloodGroup:', s.bloodGroup);     // EXPECTED: value (not undefined)
                console.log('Contact:', s.contactNumber);     // EXPECTED: value (not undefined)
                console.log('Keys:', Object.keys(s));
            }
        }

        // 4. Direct DB Verify
        const dbStudent = await User.findOne({ name: 'Ram Verma' });
        if (dbStudent) {
            console.log('--- DB DIRECT FETCH ---');
            console.log('Name:', dbStudent.name);
            console.log('Dept:', dbStudent.department);
            console.log('Blood:', dbStudent.bloodGroup);
            console.log('Contact:', dbStudent.contactNumber);
        } else {
            console.log('Ram Verma not found in DB directly.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

debugApi();
