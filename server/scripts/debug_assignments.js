import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assignment from '../src/models/Assignment.js';
import User from '../src/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

const checkAssignments = async () => {
    await connectDB();

    // Check for user 'shubh'
    // Simplified regex search or list all
    const users = await User.find({ name: /shubh/i });
    console.log(`Found ${users.length} users matching 'shubh':`);
    users.forEach(u => console.log(`- ${u.name} (ID: ${u._id}, Role: ${u.role})`));

    if (users.length > 0) {
        const userId = users[0]._id;
        const assignments = await Assignment.find({ createdBy: userId });
        console.log(`\nAssignments for first specific 'shubh' (ID: ${userId}): ${assignments.length}`);
        assignments.forEach(a => console.log(`- ${a.title} (Due: ${a.deadline})`));
    }

    console.log('\n--- ALL ASSIGNMENTS ---');
    const all = await Assignment.find({}).populate('createdBy', 'name');
    console.log(`Total Assignments in DB: ${all.length}`);
    all.forEach(a => console.log(`- ${a.title} [Created By: ${a.createdBy?.name || 'Unknown'}]`));

    mongoose.connection.close();
};

checkAssignments();
