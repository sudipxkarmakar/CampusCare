import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config({ path: 'server/.env' }); // Adjust path if necessary

const verifyTeacherSchema = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const testEmployeeId = 'T99999999999';

        // Cleanup previous test
        await User.deleteOne({ employeeId: testEmployeeId });

        console.log('Creating Test Teacher...');
        const teacher = await User.create({
            name: 'Test Teacher',
            email: 'testteacher@example.com',
            password: 'password123',
            role: 'teacher',
            employeeId: testEmployeeId,
            department: 'CSE',
            designation: 'Senior Professor',
            yearsExperience: 15,
            joiningYear: 2010,
            specialization: 'Artificial Intelligence'
        });

        console.log('Teacher Created. ID:', teacher._id);

        // Fetch back
        const fetchedTeacher = await User.findById(teacher._id);

        console.log('--- Verification Results ---');
        console.log(`Designation: ${fetchedTeacher.designation} (Expected: Senior Professor)`);
        console.log(`Years Experience: ${fetchedTeacher.yearsExperience} (Expected: 15)`);
        console.log(`Joining Year: ${fetchedTeacher.joiningYear} (Expected: 2010)`);
        console.log(`Specialization: ${fetchedTeacher.specialization} (Expected: Artificial Intelligence)`);

        if (fetchedTeacher.designation === 'Senior Professor' &&
            fetchedTeacher.yearsExperience === 15 &&
            fetchedTeacher.joiningYear === 2010 &&
            fetchedTeacher.specialization === 'Artificial Intelligence') {
            console.log('✅ SUCCESS: All fields stored correctly.');
        } else {
            console.error('❌ FAILURE: Some fields differ.');
        }

        // Cleanup
        await User.deleteOne({ _id: teacher._id });
        console.log('Test User Cleaned up.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyTeacherSchema();
