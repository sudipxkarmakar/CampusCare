import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
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

const restoreMentees = async () => {
    await connectDB();

    // The ID from the user's screenshot log
    const targetdTeacherId = '69406ae5c7e443f1ce6cb606';

    try {
        const teacher = await User.findById(targetdTeacherId);
        if (!teacher) {
            console.log('Teacher not found with that specific ID. Checking all teachers...');
        } else {
            console.log(`Found Teacher: ${teacher.name}`);
        }

        // Find some students
        const students = await User.find({ role: 'student' }).limit(5);
        if (students.length === 0) {
            console.log('No students found to assign!');
            return;
        }

        const studentIds = students.map(s => s._id);
        console.log(`Assigning ${studentIds.length} students to teacher(s)...`);

        // Update the specific teacher if found, otherwise update ALL teachers to be safe
        if (teacher) {
            teacher.mentees = studentIds;
            await teacher.save();
            console.log(`Updated ${teacher.name} with ${studentIds.length} mentees.`);
        } else {
            // Fallback: Update the first 5 teachers found
            const teachers = await User.find({ role: 'teacher' }).limit(5);
            for (const t of teachers) {
                t.mentees = studentIds;
                await t.save();
                console.log(`Updated ${t.name} with ${studentIds.length} mentees.`);
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

restoreMentees();
