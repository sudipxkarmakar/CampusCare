
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Document from '../src/models/Document.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected.");

        const docs = await Document.find({ fileUrl: { $regex: /^\/uploads\// } });

        let count = 0;
        for (const doc of docs) {
            if (!doc.fileUrl.includes('/uploads/documents/')) {
                // Incorrect path: /uploads/filename.pdf
                // Correct path: /uploads/documents/filename.pdf
                const newUrl = doc.fileUrl.replace('/uploads/', '/uploads/documents/');
                doc.fileUrl = newUrl;
                await doc.save();
                console.log(`Fixed: ${doc.title} -> ${newUrl}`);
                count++;
            }
        }

        console.log(`Migration Complete. Fixed ${count} documents.`);
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
