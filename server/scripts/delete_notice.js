
import mongoose from 'mongoose';
import Notice from '../src/models/Notice.js';
import dotenv from 'dotenv';
import path from 'path';

// Use absolute path for .env
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function deleteSpecificNotice() {
    try {
        if (!process.env.MONGO_URI) {
            console.log("Env Path tried:", envPath);
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected");

        const titleToDelete = "General Notice 1766010064711";
        const result = await Notice.deleteOne({ title: titleToDelete });

        if (result.deletedCount > 0) {
            console.log(`Successfully deleted notice: "${titleToDelete}"`);
        } else {
            console.log(`Notice not found: "${titleToDelete}"`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

deleteSpecificNotice();
