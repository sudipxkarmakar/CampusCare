import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config({ path: 'server/.env' });

const verifyContactNumber = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const testRoll = '99999999999';

        // Cleanup previous test
        await User.deleteOne({ rollNumber: testRoll });

        console.log('Creating Test Student with Contact Number...');
        const student = await User.create({
            name: 'Test Contact Student',
            email: 'contacttest@example.com',
            password: 'password123',
            role: 'student',
            rollNumber: testRoll,
            department: 'CSE',
            batch: '2025',
            section: 'A',
            contactNumber: '9876543210' // The field to verify
        });

        console.log('Student Created. ID:', student._id);

        // Fetch back
        const fetchedUser = await User.findById(student._id);

        console.log(`Contact Number: ${fetchedUser.contactNumber} (Expected: 9876543210)`);

        if (fetchedUser.contactNumber === '9876543210') {
            console.log('✅ SUCCESS: Contact Number stored correctly.');
        } else {
            console.error('❌ FAILURE: Contact Number mismatch.');
        }

        // Cleanup
        await User.deleteOne({ _id: student._id });
        console.log('Test User Cleaned up.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyContactNumber();
