
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const createHOD = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuscare");
        console.log("Connected...");

        const hodEmail = "hod.it@campuscare.com";
        const existing = await User.findOne({ email: hodEmail });

        if (existing) {
            console.log("HOD User exists:", existing);
            // Ensure dept is IT
            if (existing.department !== 'IT') {
                existing.department = 'IT';
                await existing.save();
                console.log("Updated HOD department to 'IT'.");
            }
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("123456", salt);

            const newHod = await User.create({
                name: "HOD IT",
                email: hodEmail,
                password: hashedPassword,
                role: "hod",
                department: "IT",
                designation: "Head of Department"
            });
            console.log("Created HOD User:", newHod.email);
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createHOD();
