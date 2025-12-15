import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedHostelerNotice = async () => {
    await connectDB();
    try {
        await Notice.create({
            title: 'Hostel Curfew Update',
            content: 'The curfew for all hostels has been extended to 10:30 PM for the exam week.',
            audience: 'hosteler',
            date: new Date(),
            postedBy: new mongoose.Types.ObjectId() // Random ID
        });
        console.log('✅ Created sample Hosteler notice.');
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

seedHostelerNotice();
