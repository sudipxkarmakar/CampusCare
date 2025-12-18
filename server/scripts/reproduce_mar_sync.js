import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import MarMooc from '../src/models/MarMooc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Create Mock Student
        const email = `test_student_${Date.now()}@example.com`;
        const student = await User.create({
            name: 'Test Student',
            email,
            password: 'hashedpassword',
            role: 'student',
            mar: 0,
            moocs: 0
        });
        console.log(`Created Student: ${student._id} (MAR: ${student.mar})`);

        // 2. Simulate Submit Logic
        const newRecord = await MarMooc.create({
            student: student._id,
            category: 'mar',
            title: 'Test Activity',
            points: 10,
            status: 'Proposed'
        });
        console.log(`Created Record: ${newRecord._id}`);

        // 3. Run Sync Logic (Copied from Controller)
        const allRecords = await MarMooc.find({ student: student._id });
        const totalMar = allRecords
            .filter(r => r.category === 'mar')
            .reduce((acc, curr) => acc + (curr.points || 0), 0);

        console.log(`Calculated Total MAR: ${totalMar}`);

        await User.findByIdAndUpdate(student._id, {
            mar: totalMar,
            new: true
        }); // Note: new:true doesn't matter for update, but good for returning

        // 4. Verify User Schema
        const updatedStudent = await User.findById(student._id);
        console.log(`Updated Student MAR in DB: ${updatedStudent.mar}`);

        if (updatedStudent.mar === 10) {
            console.log('SUCCESS: Logic works correctly.');
        } else {
            console.error('FAILURE: User MAR did not update.');
        }

        // Cleanup
        await User.findByIdAndDelete(student._id);
        await MarMooc.deleteMany({ student: student._id });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runTest();
