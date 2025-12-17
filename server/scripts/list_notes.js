
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Note from '../src/models/Note.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const listNotes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const notes = await Note.find({}).populate('uploadedBy', 'name email role');
        console.log(`\nTotal Notes in DB: ${notes.length}`);

        if (notes.length === 0) {
            console.log('No notes found.');
        } else {
            notes.forEach(note => {
                console.log(`\nID: ${note._id}`);
                console.log(`Title: ${note.topic}`); // Schema uses 'topic' but frontend sends 'topic' mapped from title
                console.log(`Uploaded By: ${note.uploadedBy?.name} (${note.uploadedBy?._id})`);
                console.log(`File: ${note.fileUrl}`);
                console.log(`Created At: ${note.createdAt}`);
            });
        }

        // Also list teachers to verify ID match
        const users = await User.find({ role: 'teacher' });
        console.log('\n--- Teachers ---');
        users.forEach(u => console.log(`${u.name}: ${u._id}`));

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

listNotes();
