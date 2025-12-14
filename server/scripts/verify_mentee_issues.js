import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Complaint from '../src/models/Complaint.js';

dotenv.config();

const verifyMenteeIssues = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // 1. Find a Random Teacher with mentees
        const teachers = await User.find({ role: 'teacher' });

        let selectedTeacher = null;
        let issuesFound = [];

        // Try to find a teacher whose mentees strictly have complaints
        for (const teacher of teachers) {
            const menteeIds = teacher.mentees;
            const issues = await Complaint.find({ student: { $in: menteeIds } }).populate('student', 'name rollNumber');

            if (issues.length > 0) {
                selectedTeacher = teacher;
                issuesFound = issues;
                break;
            }
        }

        if (!selectedTeacher) {
            console.log('No teacher found who has mentees with complaints. (Random chance might have failed us, re-run seed?)');
            process.exit(0);
        }

        console.log(`Teacher: ${selectedTeacher.name} (${selectedTeacher.employeeId})`);
        console.log(`Total Mentees: ${selectedTeacher.mentees.length}`);
        console.log(`Issues Reported by Mentees: ${issuesFound.length}`);

        console.log('--- Issues List ---');
        issuesFound.forEach(issue => {
            console.log(`[${issue.status}] ${issue.title} - Reported by: ${issue.student.name}`);
        });

        console.log('VERIFICATION PASSED');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyMenteeIssues();
