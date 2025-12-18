
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

const debugCounts = async () => {
    await connectDB();

    try {
        console.log("\n--- USER COUNTS BY ROLE ---");
        const roleCounts = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);
        console.log(roleCounts);

        console.log("\n--- USER COUNTS BY DEPARTMENT (Role: student) ---");
        const deptCounts = await User.aggregate([
            { $match: { role: 'student' } },
            { $group: { _id: "$department", count: { $sum: 1 } } }
        ]);
        console.log(deptCounts);

        console.log("\n--- USER COUNTS BY DEPARTMENT (Role: hosteler) ---");
        const hostelerCounts = await User.aggregate([
            { $match: { role: 'hosteler' } },
            { $group: { _id: "$department", count: { $sum: 1 } } }
        ]);
        console.log(hostelerCounts);

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

debugCounts();
