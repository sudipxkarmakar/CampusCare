
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import MarMooc from '../src/models/MarMooc.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedMarMooc = async () => {
    try {
        await connectDB();

        console.log("Seeding MAR/MOOCs...");

        // Ensure MarMooc collection exists and is clean for this student
        const student = await User.findOne({ rollNumber: '1001' });
        if (!student) {
            console.log("Student 1001 not found.");
            process.exit(1);
        }

        await MarMooc.deleteMany({ student: student._id });

        const data = [
            // MAR Records (as per screenshot)
            {
                student: student._id,
                category: 'mar',
                title: 'Tree Plantation Drive',
                platform: 'NSS',
                points: 10,
                status: 'Verified'
            },
            {
                student: student._id,
                category: 'mar',
                title: 'Tech Fest Volunteer',
                platform: 'College',
                points: 15,
                status: 'Verified'
            },
            {
                student: student._id,
                category: 'mar',
                title: 'Blood Donation Camp',
                platform: 'NSS',
                points: 10,
                status: 'Verified'
            },
            {
                student: student._id,
                category: 'mar',
                title: 'Library Assistance',
                platform: 'Library',
                points: 7,
                status: 'Verified'
            },
            // MOOC Records (as per screenshot)
            {
                student: student._id,
                category: 'mooc',
                title: 'NPTEL: Data Science',
                platform: 'NPTEL',
                points: 3,
                status: 'Verified'
            },
            {
                student: student._id,
                category: 'mooc',
                title: 'AI for Everyone',
                platform: 'Coursera',
                points: 2,
                status: 'Verified'
            },
            {
                student: student._id,
                category: 'mooc',
                title: 'Web Development',
                platform: 'Udemy',
                points: 4,
                status: 'Verified'
            },
            {
                student: student._id,
                category: 'mooc',
                title: 'Soft Skills',
                platform: 'Swayam',
                points: 3,
                status: 'Verified'
            }
        ];

        await MarMooc.insertMany(data);
        console.log(`✅ Seeded ${data.length} records for ${student.name}`);
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedMarMooc();
