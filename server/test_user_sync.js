import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './src/models/User.js';

// Reuse the token from token.txt and same IDs as before
const token = fs.readFileSync('token.txt', 'utf-8').trim();
const subjectId = '69419584206934ae1a628255';
const teacherId = '69419583206934ae1a62823b';

console.log('Testing User Sync for Subject:', subjectId);

async function test() {
    try {
        // 1. Perform Assignment
        const res = await fetch(`http://localhost:5000/api/hod/subjects/${subjectId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ teacherId, batch: 'Batch 1' })
        });

        console.log('Assign Status:', res.status);
        const data = await res.json();
        // console.log('Response:', JSON.stringify(data, null, 2));

        if (res.ok) {
            // 2. Check User DB
            await mongoose.connect(process.env.MONGO_URI);
            const teacher = await User.findById(teacherId);
            console.log('\n--- Teacher Profile ---');
            console.log('Name:', teacher.name);
            console.log('Teaching Subjects:', teacher.teachingSubjects);

            const subjectName = data.subject.name;
            if (teacher.teachingSubjects.includes(subjectName)) {
                console.log('SUCCESS: Subject found in teacher profile!');
            } else {
                console.log('FAILURE: Subject NOT found in teacher profile.');
            }
            await mongoose.disconnect();
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

test();
