
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err.message);
        process.exit(1);
    }
};

const deleteUsers = async () => {
    await connectDB();

    const emailsToDelete = [
        'hosteler@test.com',
        'hosteler1766051797541@test.com'
    ];

    try {
        const result = await User.deleteMany({ email: { $in: emailsToDelete } });
        console.log(`Deleted ${result.deletedCount} users.`);
        console.log('Emails:', emailsToDelete);
    } catch (error) {
        console.error('Error deleting users:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

deleteUsers();
