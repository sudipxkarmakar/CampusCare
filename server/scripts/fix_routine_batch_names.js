import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Routine from '../src/models/Routine.js';
import connectDB from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixRoutineBatches = async () => {
    try {
        await connectDB();
        console.log('Database Connected.');

        const routines = await Routine.find({});
        let count = 0;

        for (const r of routines) {
            // Check if batch is just a number (e.g., "1", "2")
            if (r.batch && /^\d+$/.test(r.batch)) {
                const oldBatch = r.batch;
                const newBatch = `Batch ${r.batch}`;

                // Update
                r.batch = newBatch;
                await r.save();

                count++;
                console.log(`Updated Routine ${r._id}: "${oldBatch}" -> "${newBatch}"`);
            }
        }

        console.log(`\nJob Complete. Updated ${count} routines.`);
        process.exit();

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixRoutineBatches();
