
import mongoose from 'mongoose';
import Notice from '../src/models/Notice.js';
import dotenv from 'dotenv';
import path from 'path';

// Use absolute path for .env
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function deleteSpecificNotices() {
    try {
        if (!process.env.MONGO_URI) {
            console.log("Env Path tried:", envPath);
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected");

        const titlesToDelete = [
            "Library Overdue: Data Structures",
            "CA Assignment Submission Deadline"
        ];

        const result = await Notice.deleteMany({ title: { $in: titlesToDelete } });

        if (result.deletedCount > 0) {
            console.log(`Successfully deleted ${result.deletedCount} notices.`);
        } else {
            console.log("No matching notices found to delete.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

deleteSpecificNotices();
