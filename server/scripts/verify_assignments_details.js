import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assignment from '../src/models/Assignment.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyAssignments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB`);

        const assignments = await Assignment.find({});
        console.log(`Found ${assignments.length} assignments`);

        assignments.forEach(a => {
            console.log(`Title: ${a.title} | Dept: ${a.department} | Batch: ${a.batch} | Section: ${a.section || 'All'} | Deadline: ${a.deadline}`);
        });

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyAssignments();
