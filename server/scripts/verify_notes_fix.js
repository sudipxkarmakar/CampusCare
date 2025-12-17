
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const logFile = path.join(__dirname, '../verify_notes_fix_log.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

const runTest = async () => {
    fs.writeFileSync(logFile, 'Starting Notes Test...\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        log('MongoDB Connected');

        // Reuse the teacher finding logic
        const teacher = await User.findOne({ role: 'teacher' });
        if (!teacher) {
            log('No teacher found');
            return;
        }
        log(`Teacher: ${teacher.name}`);

        const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const url = 'http://localhost:5000/api/content/note/created';
        log(`Fetching URL: ${url}`);

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        log(`Status: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            log(`Success! Notes found: ${data.length}`);
        } else {
            const text = await response.text();
            log(`Failed Body: ${text.substring(0, 500)}`);
        }

    } catch (err) {
        log(`Error: ${err.message}`);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

runTest();
