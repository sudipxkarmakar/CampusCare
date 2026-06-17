import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Achievement from './src/models/Achievement.js';
import User from './src/models/User.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const count = await Achievement.countDocuments({});
        console.log('Total Achievements:', count);

        const achievements = await Achievement.find({}).lean();
        console.log('Achievements in DB:');
        console.log(JSON.stringify(achievements, null, 2));

        const users = await User.find({ role: 'hod' }).lean();
        console.log('HOD Users:');
        console.log(users.map(u => ({ id: u._id, name: u.name, role: u.role, department: u.department })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
