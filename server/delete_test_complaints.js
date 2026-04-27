import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import dotenv from 'dotenv';

dotenv.config();

const deleteComplaints = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare');
        console.log('MongoDB Connected');

        // Exact title from the user's request/screenshot
        const titlesToDelete = ["lost my power bank"];

        for (const title of titlesToDelete) {
            const result = await Complaint.deleteMany({ title: title });
            if (result.deletedCount > 0) {
                console.log(`Deleted ${result.deletedCount} complaint(s) with title: "${title}"`);
            } else {
                console.log(`No complaints found with title: "${title}"`);
            }
        }

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

deleteComplaints();
