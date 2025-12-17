
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const listHODs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuscare");
        console.log("Connected...");

        const hods = await User.find({ role: 'hod' });
        console.log(`Found ${hods.length} HODs.`);
        hods.forEach(h => {
            console.log(`HOD: ${h.name} | Dept: ${h.department} | Email: ${h.email}`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listHODs();
