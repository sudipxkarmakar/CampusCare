import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assignment from '../src/models/Assignment.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyQuery = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const filter = {
            department: 'CSE',
            batch: '2025'
        };

        // Match logic from controller
        // filter.$or = [ { section: section }, { section: { $exists: false } }, { section: null } ];
        // Use 'A' as section
        const section = 'A';
        const query = {
            department: 'CSE',
            batch: '2025',
            $or: [
                { section: section },
                { section: { $exists: false } },
                { section: null }
            ]
        };

        const assignments = await Assignment.find(query);
        console.log(`Querying for Dept:CSE, Batch:2025, Section:A`);
        console.log(`Found ${assignments.length} matching assignments.`);
        assignments.forEach(a => console.log(`- ${a.title} (${a.deadline})`));

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyQuery();
