
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Leave from '../src/models/Leave.js';
import User from '../src/models/User.js'; // Helper for population if needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

const deleteInvalidLeaves = async () => {
    await connectDB();
    try {
        // Fetch all leaves and populate student to see if it resolves to null
        const leaves = await Leave.find().populate('student');
        console.log(`Total leaves found: ${leaves.length}`);

        const invalidLeaves = leaves.filter(leave => !leave.student);
        console.log(`Found ${invalidLeaves.length} invalid leaves (missing student reference).`);

        if (invalidLeaves.length > 0) {
            const idsToDelete = invalidLeaves.map(l => l._id);
            const result = await Leave.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`Successfully deleted ${result.deletedCount} invalid leave records.`);
        } else {
            console.log('No invalid leaves found.');
        }

    } catch (error) {
        console.error('Error deleting invalid leaves:', error);
    } finally {
        mongoose.disconnect();
    }
};

deleteInvalidLeaves();
