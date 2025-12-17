import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Subject from '../src/models/Subject.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const deleteTestSubject = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const subjectCode = 'TEST101';

        console.log(`Searching for subject with code: ${subjectCode}`);
        const result = await Subject.deleteMany({ code: subjectCode });

        if (result.deletedCount > 0) {
            console.log(`✅ SUCCESS: Deleted ${result.deletedCount} subject(s) with code '${subjectCode}'.`);
        } else {
            console.log(`⚠️  No subjects found with code '${subjectCode}'.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

deleteTestSubject();
