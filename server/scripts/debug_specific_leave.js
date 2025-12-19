
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Leave from '../src/models/Leave.js';
import User from '../src/models/User.js';

dotenv.config();

const debugLeaves = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const student = await User.findOne({ name: { $regex: 'Riya Bhatia', $options: 'i' } });

        if (!student) {
            console.log('Student not found');
            return;
        }

        console.log(`Analyzing leaves for: ${student.name}`);
        const leaves = await Leave.find({ student: student._id });

        console.log(`Total Leaves: ${leaves.length}`);

        leaves.forEach(l => {
            console.log(`[LEAVE] ID: ${l._id} | Type: ${l.type} | Status: '${l.status}' | WardenStatus: '${l.wardenStatus}' | Exists: ${l.wardenStatus !== undefined}`);
        });

        // Test Query used in Controller
        const query = {
            $or: [
                { wardenStatus: 'Pending' },
                { wardenStatus: { $exists: false }, status: { $in: ['Pending HOD Approval', 'Approved by HOD'] } }
            ]
        };

        const wardenVisible = await Leave.find({
            ...query,
            student: student._id
        });

        console.log(`\nVisible to Warden (Count: ${wardenVisible.length}):`);
        wardenVisible.forEach(l => console.log(`- ${l.type} (${l.status})`));

        // Create a NEW test leave to verify "Forward to both"
        console.log('\nCreating TEST leave...');
        const newLeave = await Leave.create({
            student: student._id,
            type: 'Home Visit', // Different type to distinguish
            startDate: new Date(),
            endDate: new Date(),
            reason: 'Auto Debug Test',
            status: 'Pending HOD Approval',
            hodStatus: 'Pending',
            wardenStatus: 'Pending' // Explicitly set as per hostelController
        });

        console.log(`Created Leave ID: ${newLeave._id}`);
        console.log(`New Leave WardenStatus: '${newLeave.wardenStatus}'`);

        // Check visibility of new leave
        const isVisible = await Leave.findOne({
            _id: newLeave._id,
            $or: [
                { wardenStatus: 'Pending' },
                { wardenStatus: { $exists: false }, status: { $in: ['Pending HOD Approval', 'Approved by HOD'] } }
            ]
        });

        console.log(`Is New Leave Visible to Warden? ${isVisible ? 'YES' : 'NO'}`);

        // Cleanup
        await Leave.findByIdAndDelete(newLeave._id);
        console.log('Test leave deleted.');

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
        mongoose.connection.close();
    }
};

debugLeaves();
