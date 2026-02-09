
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Leave from '../src/models/Leave.js';
import Complaint from '../src/models/Complaint.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

import fs from 'fs';

const logFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'reproduce_log.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

const reproduceError = async () => {
    try {
        fs.writeFileSync(logFile, 'Starting reproduction...\n');
        log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        log('Connected.');


        const hod = await User.findOne({ role: 'hod' });
        if (!hod) {
            log('No HOD found to test with.');
            return;
        }
        log('--- HOD USER DUMP ---');
        log(JSON.stringify(hod, null, 2));
        log('---------------------');

        log(`Testing with HOD: ${hod.name}, Department: ${hod.department}`);
        if (!hod.department) {
            log('CRITICAL: HOD has no department assigned!');
        }
        const department = hod.department;

        log('--- Testing Dashboard Stats Queries ---');

        // 1. Student Count
        try {
            const studentCount = await User.countDocuments({ role: 'student', department });
            log(`Student Count: ${studentCount}`);
        } catch (e) {
            log('Student Count Query Failed:', e);
        }

        // 2. Teacher Count
        try {
            const teacherCount = await User.countDocuments({ role: 'teacher', department });
            log(`Teacher Count: ${teacherCount}`);
        } catch (e) {
            log('Teacher Count Query Failed:', e);
        }

        // 3. Pending Leaves Aggregation
        try {
            log('Running Pending Leaves Aggregation...');
            const pendingLeavesCount = await Leave.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'student',
                        foreignField: '_id',
                        as: 'studentData'
                    }
                },
                { $unwind: '$studentData' },
                {
                    $match: {
                        'studentData.department': department,
                        'hodStatus': 'Pending'
                    }
                },
                { $count: 'count' }
            ]);
            const leavesCount = pendingLeavesCount.length > 0 ? pendingLeavesCount[0].count : 0;
            log(`Pending Leaves Count: ${leavesCount}`);
        } catch (e) {
            log('Pending Leaves Aggregation Failed:', e);
        }

        log('--- Testing Complaints Query ---');
        // 4. Complaints
        try {
            const students = await User.find({ role: 'student', department }).select('_id');
            const studentIds = students.map(s => s._id);
            console.log(`Found ${studentIds.length} students in department.`);

            const complaints = await Complaint.find({
                student: { $in: studentIds }
            })
                .populate('student', 'name rollNumber')
                .populate('againstUser', 'name designation')
                .sort({ createdAt: -1 });

            console.log(`Loaded ${complaints.length} complaints.`);
        } catch (e) {
            log('Complaints Query Failed:', e);
        }

    } catch (error) {
        log('General Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

reproduceError();
