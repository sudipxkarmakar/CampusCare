import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Subject from './src/models/Subject.js';

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find subjects missing academicYear
        const badSubjects = await Subject.find({ academicYear: { $exists: false } });
        console.log(`Found ${badSubjects.length} subjects missing academicYear`);

        if (badSubjects.length > 0) {
            const result = await Subject.updateMany(
                { academicYear: { $exists: false } },
                { $set: { academicYear: "2026" } } // Defaulting to 2026
            );
            console.log('Update Result:', result);
        } else {
            // Maybe it exists but is null/undefined?
            const nullSubjects = await Subject.find({ academicYear: null });
            console.log(`Found ${nullSubjects.length} subjects with null academicYear`);
            if (nullSubjects.length > 0) {
                await Subject.updateMany({ academicYear: null }, { $set: { academicYear: "2026" } });
                console.log('Fixed null academicYears');
            }
        }

        // Also just force update the specific test subject if needed
        const testSubId = '69419584206934ae1a628255';
        // Note: ID might be different if I misread logs, but the updateMany should cover it.

        console.log('Done');
        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

fix();
