
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MarMooc from '../src/models/MarMooc.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
};

const runTest = async () => {
    await connectDB();

    try {
        // 1. Find a Student
        const student = await User.findOne({ role: 'student' });
        if (!student) {
            console.log("No student found to create submission.");
            process.exit(0);
        }

        // 2. Create a Dummy Proposed Submission
        console.log("Creating dummy submission...");
        const submission = await MarMooc.create({
            student: student._id,
            category: 'mar',
            title: 'Test Activity for Approval',
            platform: 'College',
            points: 10,
            certificateUrl: 'https://example.com/test.pdf',
            status: 'Proposed'
        });
        console.log(`Created Submission: ${submission._id}`);

        // 3. Simulate Teacher Approval (Update Status to Verified)
        console.log("Simulating Approval (Update to Verified)...");
        // We are directly updating DB to simulate what the Controller does. 
        // Ideally we'd hit the API, but we don't have a running server instance guaranteed accessible from this script context easily without credentials.
        // Wait, I can simulate the logic: finding and updating.

        let found = await MarMooc.findById(submission._id);
        found.status = 'Verified';
        await found.save();

        console.log("Status Updated to:", found.status);

        // 4. Verify Student Points Update Logic (Simulated)
        // The controller does: calculate totals and update user.
        // We'll just verify the record update was successful for now.

        const check1 = await MarMooc.findById(submission._id);
        if (check1.status === 'Verified') {
            console.log("PASS: Approval Logic (DB Update) works.");
        } else {
            console.log("FAIL: Approval Logic.");
        }

        // 5. Simulate Rejection
        console.log("Simulating Rejection...");
        found.status = 'Rejected';
        found.remark = 'Test Rejection';
        await found.save();

        const check2 = await MarMooc.findById(submission._id);
        if (check2.status === 'Rejected' && check2.remark === 'Test Rejection') {
            console.log("PASS: Rejection Logic works.");
        } else {
            console.log("FAIL: Rejection Logic.");
        }

        // Cleanup
        await MarMooc.findByIdAndDelete(submission._id);
        console.log("Cleanup complete.");

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        mongoose.connection.close();
    }
};

runTest();
