
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MarMooc from '../src/models/MarMooc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const debugMar = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const mars = await MarMooc.find({ category: 'mar' }).limit(10);
        console.log(`Found ${mars.length} MAR records.`);

        mars.forEach(m => {
            console.log(`- Title: "${m.title}"`);
            console.log(`  CertificateUrl: '${m.certificateUrl}'`);
            console.log(`  Full Object:`, JSON.stringify(m.toObject(), null, 2));
            console.log('---');
        });

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugMar();
