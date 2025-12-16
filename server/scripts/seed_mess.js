import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import MessMenu from '../src/models/MessMenu.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedMess = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is missing!");
            process.exit(1);
        }
        await connectDB();

        await MessMenu.deleteMany({});

        const menuData = JSON.parse(fs.readFileSync(path.join(__dirname, 'mess_menu_data.json'), 'utf-8'));

        await MessMenu.insertMany(menuData);

        console.log('✅ Mess Menu Seeded!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedMess();
