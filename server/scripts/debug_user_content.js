import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Assignment from '../src/models/Assignment.js';
import Note from '../src/models/Note.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const debugContent = async () => {
    await connectDB();

    try {
        // 1. Get the most recently created student
        const student = await User.findOne({ role: 'student' }).sort({ createdAt: -1 });

        if (!student) {
            console.log('No students found!');
            process.exit();
        }

        console.log('--- LATEST STUDENT ---');
        console.log(`Name: ${student.name}`);
        console.log(`Email: ${student.email}`);
        console.log(`Dept: ${student.department}`);
        console.log(`Year: ${student.year}`);
        console.log(`Batch: ${student.batch}`);
        console.log(`SubBatch: ${student.subBatch}`);
        console.log(`Section: ${student.section}`);
        console.log('----------------------');

        // 2. Find Assignments that SHOULD match
        // Logic from getMyContent:
        // department == dept
        // year == year
        // batch == batch OR 'All'? (getMyContent checks batch match)

        const assignments = await Assignment.find({});
        console.log(`Total Assignments: ${assignments.length}`);

        console.log('\n--- MATCHING ANALYSIS ---');
        assignments.forEach(a => {
            let match = true;
            let reasons = [];

            if (a.department !== student.department) { match = false; reasons.push(`Dept mismatch (${a.department} vs ${student.department})`); }
            if (a.year !== student.year) { match = false; reasons.push(`Year mismatch (${a.year} vs ${student.year})`); }

            // Batch Logic
            // $or: [ { batch: batch, subBatch: undefined }, { batch: batch, subBatch: null }, { batch: batch, subBatch: subBatch } ]
            // Note: Does Assignment field 'batch' match student 'batch'?
            // And if student has subBatch, does assignment have it or is it generic?

            const batchMatch = (a.batch === student.batch);

            // Note: getMyContent logic:
            // matches if: verify specific subBatch logic
            // My controller logic: 
            // { batch: batch, subBatch: { $exists: false } } -> Matches if Assign has Batch X and NO subBatch
            // { batch: batch, subBatch: null } -> Matches if Assign has Batch X and NULL subBatch
            // { batch: batch, subBatch: subBatch } -> Matches if Assign has Batch X AND SubBatch Y

            let batchLogicMatch = false;
            if (a.batch === student.batch) {
                if (!a.subBatch || a.subBatch === student.subBatch) {
                    batchLogicMatch = true;
                } else {
                    reasons.push(`SubBatch mismatch (${a.subBatch} vs ${student.subBatch})`);
                }
            } else {
                reasons.push(`Batch mismatch (${a.batch} vs ${student.batch})`);
            }

            if (!batchLogicMatch) match = false;

            console.log(`Assignment "${a.title}": ${match ? 'MATCHES' : 'FAILS'} -> ${reasons.join(', ')}`);
            if (a.section) console.log(`   [Warn] Assignment has section '${a.section}' but logic ignores it.`);
        });

        // 3. Find Notes
        const notes = await Note.find({});
        console.log(`\nTotal Notes: ${notes.length}`);
        notes.forEach(n => {
            // Same Logic
            let match = true;
            let reasons = [];
            if (n.department !== student.department) { match = false; reasons.push(`Dept mismatch (${n.department} vs ${student.department})`); }
            if (n.year !== student.year) { match = false; reasons.push(`Year mismatch (${n.year} vs ${student.year})`); }

            if (n.batch === student.batch) {
                if (n.subBatch && n.subBatch !== student.subBatch) {
                    match = false;
                    reasons.push(`SubBatch mismatch (${n.subBatch} vs ${student.subBatch})`);
                }
            } else {
                match = false;
                reasons.push(`Batch mismatch (${n.batch} vs ${student.batch})`);
            }

            console.log(`Note "${n.topic}": ${match ? 'MATCHES' : 'FAILS'} -> ${reasons.join(', ')}`);
        });

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

debugContent();
