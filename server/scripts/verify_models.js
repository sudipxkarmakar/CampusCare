import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import all models
import User from '../src/models/User.js';
import Leave from '../src/models/Leave.js';
import Complaint from '../src/models/Complaint.js';
import Assignment from '../src/models/Assignment.js';
import Notice from '../src/models/Notice.js';
import Alumni from '../src/models/Alumni.js';
import Book from '../src/models/Book.js';
import LibraryTransaction from '../src/models/LibraryTransaction.js';
import Document from '../src/models/Document.js';
import Routine from '../src/models/Routine.js';
import MarMooc from '../src/models/MarMooc.js';
import Note from '../src/models/Note.js';
import MessMenu from '../src/models/MessMenu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyModels = async () => {
    try {
        console.log('Testing Model Loading...');

        const models = {
            User, Leave, Complaint, Assignment, Notice,
            Alumni, Book, LibraryTransaction, Document,
            Routine, MarMooc, Note, MessMenu
        };

        for (const [name, model] of Object.entries(models)) {
            if (model && model.modelName === name) {
                console.log(`✅ ${name} Model Loaded.`);
            } else {
                console.error(`❌ ${name} Model Failed to Load.`);
            }
        }

        console.log('Connecting to DB to verify details...');
        // Just check connection, no need to write data for now unless needed
        if (process.env.MONGO_URI) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('✅ Connected to MongoDB successfully.');
            await mongoose.disconnect();
        } else {
            console.log('⚠️ MONGO_URI not found, skipping DB connection test.');
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
};

verifyModels();
