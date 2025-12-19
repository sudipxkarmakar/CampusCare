
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Leave from '../src/models/Leave.js';
import User from '../src/models/User.js';
import fs from 'fs';

dotenv.config();

const dumpRiya = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const leaves = await Leave.find({}).populate('student', 'name');
        const riyaLeaves = leaves.filter(l => l.student && l.student.name && l.student.name.toLowerCase().includes('riya'));

        let output = '';
        riyaLeaves.forEach(l => {
            output += `ID: ${l._id}\nREASON: ${l.reason}\n---\n`;
        });

        fs.writeFileSync('riya_leaves.txt', output);
        console.log('Written to riya_leaves.txt');

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
        mongoose.connection.close();
    }
}
dumpRiya();
