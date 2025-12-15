import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Notice from '../src/models/Notice.js';
import Complaint from '../src/models/Complaint.js';
import Book from '../src/models/Book.js';
import Alumni from '../src/models/Alumni.js';
import Assignment from '../src/models/Assignment.js';
import Leave from '../src/models/Leave.js';
import MessMenu from '../src/models/MessMenu.js';
import MarMooc from '../src/models/MarMooc.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkCounts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to Host: ${mongoose.connection.host}`);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const users = await User.countDocuments();
        const notices = await Notice.countDocuments();
        const complaints = await Complaint.countDocuments();
        const books = await Book.countDocuments();
        const alumni = await Alumni.countDocuments();
        const assignments = await Assignment.countDocuments();
        const leaves = await Leave.countDocuments();
        const mess = await MessMenu.countDocuments();
        const mar = await MarMooc.countDocuments();

        console.log('--- Database Counts ---');
        console.log(`Users: ${users}`);
        console.log(`Notices: ${notices}`);
        console.log(`Complaints: ${complaints}`);
        console.log(`Books: ${books}`);
        console.log(`Alumni: ${alumni}`);
        console.log(`Assignments: ${assignments}`);
        console.log(`Leaves: ${leaves}`);
        console.log(`Mess Menus: ${mess}`);
        console.log(`MAR/MOOCS: ${mar}`);
        console.log('-----------------------');

        // Debug: Try finding ANY complaint
        const allComplaints = await Complaint.find({});
        console.log(`Actual Complaints array length: ${allComplaints.length}`);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkCounts();
