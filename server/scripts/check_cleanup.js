import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkRemnants = async () => {
    try {
        await connectDB();

        // Check for existence of fields
        // Note: validation might strip them from results if not in schema, so we use strict: false or pure mongo driver check if possible, 
        // but mongoose find with query filter works on DB level.
        const xpCount = await User.countDocuments({ xp: { $exists: true } });
        const streakCount = await User.countDocuments({ streak: { $exists: true } });

        console.log(`Users with 'xp': ${xpCount}`);
        console.log(`Users with 'streak': ${streakCount}`);

        if (xpCount > 0 || streakCount > 0) {
            console.log("⚠️  Found remnants. Cleaning up...");
            await User.updateMany({}, { $unset: { xp: "", streak: "" } });
            console.log("✅ Cleanup executed.");
        } else {
            console.log("✅ Database is clean. No 'xp' or 'streak' found.");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
checkRemnants();
