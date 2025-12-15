import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Assignment from '../src/models/Assignment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const migrateNotes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find assignments with "Note" in title but type is not 'note'
        const result = await Assignment.updateMany(
            {
                title: { $regex: /note/i },
                type: { $ne: 'note' }
            },
            {
                $set: { type: 'note', deadline: null } // Clear deadline too
            }
        );

        console.log(`Migrated ${result.modifiedCount} assignments to Notes.`);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

migrateNotes();
