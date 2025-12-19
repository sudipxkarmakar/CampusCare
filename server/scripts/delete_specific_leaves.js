
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Leave from '../src/models/Leave.js';
import User from '../src/models/User.js';

dotenv.config();

const deleteRiyaLeave = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const riya = await User.findOne({ name: { $regex: 'Riya', $options: 'i' } });
        if (riya) {
            console.log(`Found Riya: ${riya._id}`);
            // Find all leaves first to debug
            const leaves = await Leave.find({ student: riya._id });
            console.log('Riya Leaves:', leaves.map(l => `${l._id}: ${l.reason} (${l.status})`));

            // Delete the one with NIGHT OUT
            const result = await Leave.deleteOne({
                student: riya._id,
                reason: { $regex: 'NIGHT OUT', $options: 'i' }
            });
            console.log(`Deleted Riya's 'NIGHT OUT' leave: ${result.deletedCount} document(s)`);
        } else {
            console.log('Riya not found');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
        mongoose.connection.close();
    }
};

deleteRiyaLeave();
