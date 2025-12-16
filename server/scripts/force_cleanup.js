import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const forceCleanup = async () => {
    try {
        await connectDB();

        console.log("🚀 Starting RAW Cleanup...");

        // Use Raw Driver - Bypass Mongoose Schema
        const collection = mongoose.connection.db.collection('users');

        // Check counts before
        const beforeCount = await collection.countDocuments({
            $or: [{ xp: { $exists: true } }, { streak: { $exists: true } }]
        });
        console.log(`Documents with xp/streak (Raw Check): ${beforeCount}`);

        if (beforeCount > 0) {
            const result = await collection.updateMany(
                {},
                { $unset: { xp: "", streak: "" } }
            );
            console.log(`✅ RAW Update Result: Modified ${result.modifiedCount} documents.`);
        } else {
            console.log("⚠️ Raw check found nothing? Reviewing sample...");
            const sample = await collection.findOne({ name: "Sudip Karmakar" });
            console.log("Sample (Sudip):", sample);
        }

        // Verify after
        const afterCount = await collection.countDocuments({
            $or: [{ xp: { $exists: true } }, { streak: { $exists: true } }]
        });
        console.log(`Documents remaining with xp/streak: ${afterCount}`);

        process.exit(0);
    } catch (e) {
        console.error("❌ Cleanup failed:", e);
        process.exit(1);
    }
};

forceCleanup();
