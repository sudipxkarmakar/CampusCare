import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import User from '../src/models/User.js';
import Assignment from '../src/models/Assignment.js';
import Complaint from '../src/models/Complaint.js';
import Leave from '../src/models/Leave.js';
import Notice from '../src/models/Notice.js';

dotenv.config({ path: '../.env' }); // Adjust path to .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dumpData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            // Fallback for local development if .env is not picked up correctly or empty
             console.log('MONGO_URI not found in env, using default localhost');
        }
        
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';

        await mongoose.connect(mongoURI);
        console.log(`Connected to MongoDB: ${mongoURI}`);

        const dumpDir = path.join(__dirname, '../database_dump');
        if (!fs.existsSync(dumpDir)) {
            fs.mkdirSync(dumpDir);
        }

        const models = {
            User,
            Assignment,
            Complaint,
            Leave,
            Notice
        };

        for (const [name, model] of Object.entries(models)) {
            const data = await model.find({});
            const filePath = path.join(dumpDir, `${name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Dumped ${name} collection to ${filePath}`);
        }

        console.log('Database dump completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error dumping database:', error);
        process.exit(1);
    }
};

dumpData();
