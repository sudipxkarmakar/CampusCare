
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MarMooc from '../src/models/MarMooc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected.");

        // Check for specific titles seen in screenshot
        const titlesToCheck = ['Tree Plantation', 'React Native Advanced', 'Health Camp Volunteer'];

        const found = await MarMooc.find({ title: { $in: titlesToCheck } });

        console.log(`Found ${found.length} matching records.`);
        found.forEach(f => console.log(`- ${f.title} (${f.category}) - ${f.status}`));

        if (found.length > 0) {
            console.log("\n✅ CONFIRMED: Data is present in the MongoDB database.");
        } else {
            console.log("\n❌ WARNING: Data from screenshot NOT found in DB. Might be hardcoded html?");
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
