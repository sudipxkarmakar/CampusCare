import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Complaint from '../src/models/Complaint.js';
import Alumni from '../src/models/Alumni.js';
import Book from '../src/models/Book.js';
import LibraryTransaction from '../src/models/LibraryTransaction.js';
import Document from '../src/models/Document.js';
import Routine from '../src/models/Routine.js';
import Assignment from '../src/models/Assignment.js';
import Notice from '../src/models/Notice.js';
import MarMooc from '../src/models/MarMooc.js';
import Note from '../src/models/Note.js';
import MessMenu from '../src/models/MessMenu.js';
import Leave from '../src/models/Leave.js';

// Connection String from User Request
const MONGO_URI = 'mongodb+srv://skmultiverse:skmultiverse@cluster0.y46rdtn.mongodb.net/?appName=Cluster0';

const checkCollection = async (modelName, query = {}) => {
    try {
        const model = mongoose.model(modelName);
        const count = await model.countDocuments(query);
        return { status: 'OK', count, error: null };
    } catch (err) {
        return { status: 'ERROR', count: 0, error: err.message };
    }
};

const verifyEntities = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const results = {};

        // 1. Student (User role)
        results['Student'] = await checkCollection('User', { role: 'student' });

        // 2. Teacher (User role)
        results['Teacher'] = await checkCollection('User', { role: 'teacher' });

        // 3. Hostler (User role)
        results['Hostler'] = await checkCollection('User', { role: 'hostler' });

        // 4. Complaint
        results['Complaint'] = await checkCollection('Complaint');

        // 5. Alumni (User role + Alumni Profile)
        const alumniUsers = await checkCollection('User', { role: 'alumni' });
        const alumniProfiles = await checkCollection('Alumni');
        results['Allumni (User)'] = alumniUsers;
        results['Allumni (Profile)'] = alumniProfiles;

        // 6. Library (Book + Transaction)
        results['Library (Book)'] = await checkCollection('Book');
        results['Library (Transaction)'] = await checkCollection('LibraryTransaction');

        // 7. Document
        results['Document'] = await checkCollection('Document');

        // 8. Routine
        results['Routine'] = await checkCollection('Routine');

        // 9. Assignment
        results['Assignment'] = await checkCollection('Assignment');

        // 10. Notice
        results['Notice'] = await checkCollection('Notice');

        // 11. Mar moocs
        results['MarMooc'] = await checkCollection('MarMooc');

        // 12. Notes
        results['Notes'] = await checkCollection('Note');

        // 13. Mess menu
        results['MessMenu'] = await checkCollection('MessMenu');

        // 14. Leave application
        results['Leave'] = await checkCollection('Leave');

        console.table(results);

    } catch (err) {
        console.error('Script Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed');
    }
};

verifyEntities();
