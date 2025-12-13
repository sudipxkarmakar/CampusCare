import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const listDatabases = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!');

        // Use the Admin object to list databases
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const result = await admin.listDatabases();

        console.log('------------------------------------------------');
        console.log(`🌐 Databases in this Cluster (${mongoose.connection.host}):`);
        result.databases.forEach(db => {
            console.log(` - ${db.name} \t(${db.sizeOnDisk} bytes)`);
        });
        console.log('------------------------------------------------');

        // Check specifically for user's mentioned databases to confirm identity
        const dbNames = result.databases.map(d => d.name);
        const hasQuickBlog = dbNames.includes('quickblog');
        const hasCampusCare = dbNames.includes('campuscare');

        if (hasQuickBlog && hasCampusCare) {
            console.log("✅ MATCH: Found 'quickblog' (User's) and 'campuscare' (Ours). They exist together!");
            console.log("👉 ACTION: The user likely just needs to refresh the browser.");
        } else if (hasQuickBlog && !hasCampusCare) {
            console.log("❌ MISMATCH: Found 'quickblog' but NOT 'campuscare'. Did it get deleted?");
        } else if (!hasQuickBlog && hasCampusCare) {
            console.log("❌ MISMATCH: Found 'campuscare' but NOT 'quickblog'. We are connected to a DIFFERENT Cluster!");
        } else {
            console.log("❓ UNKNOWN: Found neither. Are we in the right place?");
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

listDatabases();
