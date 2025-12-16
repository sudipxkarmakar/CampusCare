import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyStaff = async () => {
    try {
        await connectDB();

        console.log('--- STAFF COUNTS ---');
        console.log("Teachers:", await User.countDocuments({ role: 'teacher' }));
        console.log("HODs:", await User.countDocuments({ role: 'hod' }));
        console.log("Principal:", await User.countDocuments({ role: 'principal' }));
        console.log("Warden:", await User.countDocuments({ role: 'warden' }));

        console.log('\n--- SAMPLES ---');
        const p = await User.findOne({ role: 'principal' });
        console.log(`Principal: ${p ? p.name : 'MISSING'}`);

        const w = await User.findOne({ role: 'warden' });
        console.log(`Warden: ${w ? w.name : 'MISSING'}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
verifyStaff();
