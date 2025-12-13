import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const updateIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const collection = mongoose.connection.collection('users');

        // List indexes
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes.map(i => i.name));

        // Drop rollNumber and employeeId indexes if they exist
        try {
            await collection.dropIndex('rollNumber_1');
            console.log('🗑️ Dropped rollNumber_1 index');
        } catch (e) { console.log('ℹ️ rollNumber_1 index not found or already dropped'); }

        try {
            await collection.dropIndex('employeeId_1');
            console.log('🗑️ Dropped employeeId_1 index');
        } catch (e) { console.log('ℹ️ employeeId_1 index not found or already dropped'); }

        // Create Compound Indexes (Optional, or handled by Schema validation)
        // We will stick to Logic Validation in Controller for flexibility, 
        // to avoid complex index management for now, or add them here.
        // await collection.createIndex({ rollNumber: 1, department: 1 }, { unique: true, sparse: true });
        // console.log('✨ Created compound index for Roll+Dept');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

updateIndexes();
