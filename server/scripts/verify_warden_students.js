
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyWardenStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Check if we have any hostelers
        const hostelers = await User.find({ role: 'hosteler' });
        console.log(`Found ${hostelers.length} hostelers in DB.`);

        if (hostelers.length === 0) {
            console.log('Creating a dummy hosteler for testing...');
            await User.create({
                name: 'Test Hosteler',
                email: 'hosteler@test.com',
                password: 'password123',
                role: 'hosteler',
                hostelName: 'H1',
                roomNumber: '101',
                department: 'CSE',
                year: '1st Year',
                rollNumber: 'CS101'
            });
            console.log('Dummy hosteler created.');
        }

        // 2. Simulate what the controller does
        const fetchedHostelers = await User.find({ role: 'hosteler' })
            .select('name rollNumber department year hostelName roomNumber contactNumber email profilePicture')
            .sort({ name: 1 });

        console.log('Controller Logic Verification:');
        console.log(JSON.stringify(fetchedHostelers, null, 2));

        console.log('Verification Successful: Data can be fetched.');

        process.exit(0);
    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
};

verifyWardenStudents();
