
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

const logFile = path.join(__dirname, '../verify_fix_log.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

const runTest = async () => {
    fs.writeFileSync(logFile, 'Starting Test...\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        log('MongoDB Connected');

        const teacher = await User.findOne({ role: 'teacher' });
        if (!teacher) {
            log('No teacher found');
            return;
        }
        log(`Teacher: ${teacher.name}`);

        const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const url = 'http://localhost:5000/api/content/assignment/created';
        log(`Fetching URL: ${url}`);

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        log(`Status: ${response.status}`);

        const text = await response.text();
        log(`Body: ${text.substring(0, 500)}`); // First 500 chars

    } catch (err) {
        log(`Error: ${err.message}`);
        if (err.cause) log(`Cause: ${err.cause}`);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

runTest();
