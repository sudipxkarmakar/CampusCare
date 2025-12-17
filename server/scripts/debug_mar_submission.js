

import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifySubmission = async () => {
    try {
        await connectDB();

        console.log("--- Debugging MAR Submission API ---");

        // 1. Get Student Token (Simulate Login)
        // We can't generate a token easily without the secret, 
        // OR we can just test the Controller logic if we Mock the req object?
        // Actually, let's just use the DB to find the student and manually run the logic if we can't hit the API.
        // BUT to test the route, we need a token.
        // Let's rely on "verify_teacher_schema.js" approach of "Simulate API" if possible, 
        // OR just check if the backend *would* accept this data.

        // Alternative: Use the "run_command" to curl if the server was running, 
        // but since I am the server dev, I can just call the controller function directly in a harness.

        const student = await User.findOne({ rollNumber: '1001' });
        if (!student) throw new Error("Student 1001 not found");

        const mockReq = {
            user: student,
            body: {
                category: 'mar',
                title: 'Tech Fest Volunteer',
                platform: 'College',
                points: 5,
                link: 'pending_verification.pdf' // The frontend sends this
            }
        };

        const mockRes = {
            status: (code) => ({
                json: (data) => console.log(`[Response ${code}]`, data)
            }),
            json: (data) => console.log(`[Response 200]`, data)
        };

        console.log("Simulating Controller Call...");

        // Import controller dynamically or copy logic? 
        // Importing is better.
        const { submitMarMooc } = await import('../src/controllers/marMoocController.js');

        await submitMarMooc(mockReq, mockRes);

        console.log("✅ Controller Logic executed without crash.");
        process.exit(0);

    } catch (e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
};

verifySubmission();
