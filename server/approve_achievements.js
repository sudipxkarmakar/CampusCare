import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Achievement from './src/models/Achievement.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Update all achievements submitted by hod to 'approved' status
        const result = await Achievement.updateMany(
            { submittedByRole: { $in: ['hod', 'HOD'] } },
            { $set: { status: 'approved' } }
        );
        console.log(`Updated ${result.modifiedCount} achievements to approved.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
