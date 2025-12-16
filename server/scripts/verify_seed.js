import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifySeed = async () => {
    try {
        await connectDB();

        const count = await User.countDocuments({});
        console.log(`Total Users: ${count}`);

        // Check Fixed Users
        const fixed = await User.find({ rollNumber: { $in: ["1", "2", "3", "4"] } }).sort({ rollNumber: 1 });
        fixed.forEach(u => console.log(`Roll ${u.rollNumber}: ${u.name} (${u.role})`));

        // Check Logic for Roll 20 (Student) and 21 (Hosteler)
        const u20 = await User.findOne({ rollNumber: "20" });
        const u21 = await User.findOne({ rollNumber: "21" });
        const u25 = await User.findOne({ rollNumber: "25" }); // Hosteler
        const u26 = await User.findOne({ rollNumber: "26" }); // Student

        console.log(`Roll 20: ${u20 ? u20.role : 'Missing'}`);
        console.log(`Roll 21: ${u21 ? u21.role : 'Missing'}`);
        console.log(`Roll 25: ${u25 ? u25.role : 'Missing'}`);
        console.log(`Roll 26: ${u26 ? u26.role : 'Missing'}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
verifySeed();
