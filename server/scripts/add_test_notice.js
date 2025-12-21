
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Notice from '../src/models/Notice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const addTestNotice = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        await Notice.create({
            title: "Universal Student Notice",
            content: "This is for all students, no department.",
            audience: "student",
            date: new Date(),
            postedBy: new mongoose.Types.ObjectId('69445b4681d7ad4cb464cb58')
        });

        console.log("Added Universal Student Notice");
        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

addTestNotice();
