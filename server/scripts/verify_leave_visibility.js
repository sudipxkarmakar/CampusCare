
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Leave from '../src/models/Leave.js';
import User from '../src/models/User.js';

dotenv.config();

const verifyVisibility = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Create a dummy hosteler
        const student = await User.create({
            name: 'Test Student Visibility',
            email: `testvis${Date.now()}@example.com`,
            password: 'password123',
            role: 'student',
            hosteler: true,
            roomNumber: '101',
            hostelName: 'Boys Hostel A'
        });

        // 1. Legacy Pending (No wardenStatus, Status: Pending HOD Approval)
        const legacyPending = await Leave.create({
            student: student._id,
            type: 'Night Out',
            startDate: new Date(),
            endDate: new Date(),
            reason: 'Legacy Pending Test',
            status: 'Pending HOD Approval'
            // wardenStatus intentionally undefined
        });

        // 2. Legacy Approved (No wardenStatus, Status: Approved by HOD)
        const legacyApproved = await Leave.create({
            student: student._id,
            type: 'Medical',
            startDate: new Date(),
            endDate: new Date(),
            reason: 'Legacy Approved Test',
            status: 'Approved by HOD'
            // wardenStatus intentionally undefined
        });

        // 3. New Pending (wardenStatus: Pending)
        const newPending = await Leave.create({
            student: student._id,
            type: 'Home Visit',
            startDate: new Date(),
            endDate: new Date(),
            reason: 'New Pending Test',
            status: 'Pending HOD Approval',
            wardenStatus: 'Pending'
        });

        console.log('\n--- Simulation Data Created ---');
        console.log(`Legacy Pending ID: ${legacyPending._id}`);
        console.log(`Legacy Approved ID: ${legacyApproved._id}`);
        console.log(`New Pending ID: ${newPending._id}`);

        // Simulate Warden Query
        const pendingLeaves = await Leave.find({
            $or: [
                { wardenStatus: 'Pending' },
                { wardenStatus: { $exists: false }, status: { $in: ['Pending HOD Approval', 'Approved by HOD'] } }
            ]
        });

        console.log('\n--- Query Results ---');
        console.log(`Total Pending Leaves Found: ${pendingLeaves.length}`);

        const foundIds = pendingLeaves.map(l => l._id.toString());

        const isLegacyPendingFound = foundIds.includes(legacyPending._id.toString());
        const isLegacyApprovedFound = foundIds.includes(legacyApproved._id.toString());
        const isNewPendingFound = foundIds.includes(newPending._id.toString());

        console.log(`Legacy Pending Visible: ${isLegacyPendingFound ? 'PASS' : 'FAIL'}`);
        console.log(`Legacy Approved Visible: ${isLegacyApprovedFound ? 'PASS' : 'FAIL'}`);
        console.log(`New Pending Visible: ${isNewPendingFound ? 'PASS' : 'FAIL'}`);

        // Cleanup
        await Leave.deleteMany({ _id: { $in: [legacyPending._id, legacyApproved._id, newPending._id] } });
        await User.findByIdAndDelete(student._id);
        console.log('\nCleanup successful');

        if (isLegacyPendingFound && isLegacyApprovedFound && isNewPendingFound) {
            console.log('\nSUCCESS: All leave types are visible to Warden.');
        } else {
            console.log('\nFAILURE: Some leave types are missing.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
};

verifyVisibility();
