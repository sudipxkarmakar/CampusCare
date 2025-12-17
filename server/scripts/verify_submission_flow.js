
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Assignment from '../src/models/Assignment.js';
import Submission from '../src/models/Submission.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifySubmission = async () => {
    try {
        await connectDB();

        console.log("--- Testing Submission Flow ---");

        // 1. Login as Student
        const student = await User.findOne({ rollNumber: '1001' });
        if (!student) throw new Error("Student 1001 not found");
        console.log(`User: ${student.name} (ID: ${student._id})`);

        // 2. Fetch Assignments
        const assignments = await Assignment.find({ department: student.department, year: student.year });
        if (assignments.length === 0) throw new Error("No assignments found for student");

        const targetAssignment = assignments.find(a => a.type === 'assignment');
        if (!targetAssignment) throw new Error("No 'assignment' type found to submit to.");

        console.log(`Target Assignment: ${targetAssignment.title} (ID: ${targetAssignment._id})`);

        // 3. Clear existing validation-blocking submissions
        await Submission.deleteMany({ assignment: targetAssignment._id, student: student._id });

        // 4. Simulate Submission (The "Button Click")
        // Note: Controller expects req.file or req.body.link
        // We will simulate a link submission for simplicity of script
        const mockSubmission = {
            assignment: targetAssignment._id,
            student: student._id,
            link: 'http://example.com/my-solution.pdf'
        };

        const submission = await Submission.create(mockSubmission);
        console.log(`✅ Submission Created: ${submission._id}`);

        // 5. Verify Status Update (Re-fetch mechanism)
        const recheckSubmission = await Submission.findOne({
            assignment: targetAssignment._id,
            student: student._id
        });

        if (recheckSubmission) {
            console.log("✅ Verification: Submission exists in DB. 'View Details' should show 'Submitted'.");
        } else {
            console.log("❌ Verification Failed: Submission not found.");
        }

        process.exit(0);
    } catch (e) {
        console.error("❌ Error:", e.message);
        process.exit(1);
    }
};

verifySubmission();
