import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(connStr);
        console.log(`MongoDB Connected to ${connStr.split('@')[1] || 'localhost'}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const cleanup = async () => {
    await connectDB();
    try {
        const Subject = (await import('./src/models/Subject.js')).default;

        // Delete subjects starting with "IT Subject"
        const result = await Subject.deleteMany({ name: /^IT Subject/ });
        console.log(`Deleted ${result.deletedCount} dummy subjects.`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

cleanup();
