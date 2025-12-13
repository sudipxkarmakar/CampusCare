import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const checkConnection = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);

        console.log('✅ Connected!');
        console.log('------------------------------------------------');
        console.log(`🏠 Host: ${mongoose.connection.host}`);
        console.log(`📦 Database Name: ${mongoose.connection.name}`);
        console.log(`🆔 Role: ${mongoose.connection.user || 'Unknown'}`);
        console.log('------------------------------------------------');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📂 Collections in '${mongoose.connection.name}':`);
        collections.forEach(c => console.log(` - ${c.name}`));
        console.log('------------------------------------------------');

    } catch (error) {
        console.error('❌ Connection Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

checkConnection();
