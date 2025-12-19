
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Leave from '../src/models/Leave.js';
import User from '../src/models/User.js';

dotenv.config();

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const student = await User.findOne({ name: { $regex: 'Riya Bhatia', $options: 'i' } });
        if (!student) { console.log("Student not found"); return; }

        const leaves = await Leave.find({ student: student._id });

        console.log("--- START DUMP ---");
        console.log(JSON.stringify(leaves, null, 2));
        console.log("--- END DUMP ---");

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
        mongoose.connection.close();
    }
}
inspect();
