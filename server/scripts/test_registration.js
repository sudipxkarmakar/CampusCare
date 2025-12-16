import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const testRegistration = async () => {
    try {
        await connectDB();

        const testUser = {
            name: "Test Student",
            email: "test.student@example.com",
            password: "password123",
            role: "student",
            department: "CSE",
            rollNumber: "99999999999", // 11 digits
            batch: "2024",
            section: "A",
            contactNumber: "1234567890"
        };

        console.log("Attempting to register user:", testUser.email);

        // Check if exists first and cleanup
        await User.deleteOne({ email: testUser.email });

        // Simulate Controller Logic directly for quick verification
        // (Alternative: make HTTP request to running server, but this is faster/self-contained)
        const user = await User.create(testUser);

        console.log("✅ User created in DB:", user._id);

        // Verify Persistence
        const found = await User.findById(user._id);
        if (found) {
            console.log("✅ Verified: User found in DB via findById.");
        } else {
            console.error("❌ Error: User NOT found in DB after create.");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Registration Test Failed:", error);
        process.exit(1);
    }
};

testRegistration();
