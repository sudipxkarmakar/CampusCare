import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const showSchema = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('--- 1. Application Schema (Mongoose Code) ---');
        console.log('Fields defined in User.js:');
        User.schema.eachPath((pathname, schemaType) => {
            console.log(` - ${pathname}: ${schemaType.instance} ${schemaType.options.required ? '(Required)' : ''}`);
        });

        console.log('\n--- 2. Database Indexes (Actual MongoDB) ---');
        const indexes = await User.collection.getIndexes();
        console.log(JSON.stringify(indexes, null, 2));

        console.log('\n--- 3. Sample Document ---');
        const sample = await User.findOne().lean();
        if (sample) {
            console.log(sample);
        } else {
            console.log("No users found.");
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected');
    }
};

showSchema();
