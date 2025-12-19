
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const updateStudentData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const count = await User.countDocuments({});
        console.log(`Total Users in DB: ${count}`);

        // Update all users with role 'student' or 'hosteler'
        const result = await User.updateMany(
            { role: { $in: ['student', 'hosteler'] } },
            {
                $set: {
                    bloodGroup: 'B+',
                    contactNumber: '+91 98765 43210'
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} students with default Blood Group and Contact.`);

        // Verify one
        const student = await User.findOne({ role: 'student' });
        if (student) {
            console.log('Sample Student Department:', student.department);
            console.log('Sample Student BloodGroup:', student.bloodGroup);
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

updateStudentData();
