import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import MarMooc from '../src/models/MarMooc.js';

dotenv.config();

const COURSES = [
    { title: 'Introduction to Python', platform: 'Coursera', points: 10 },
    { title: 'Data Structures and Algorithms', platform: 'NPTEL', points: 20 },
    { title: 'Web Development Bootcamp', platform: 'Udemy', points: 15 },
    { title: 'Machine Learning', platform: 'Coursera', points: 20 },
    { title: 'Cloud Computing 101', platform: 'AWS', points: 10 },
    { title: 'Soft Skills Development', platform: 'Internal', points: 5 },
    { title: 'Cyber Security Basics', platform: 'EdX', points: 10 },
    { title: 'IoT Workshop', platform: 'Workshop', points: 5 }
];

const STATUSES = ['Proposed', 'Ongoing', 'Completed', 'Verified'];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedMarMoocs = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Clear existing MAR/MOOCs
        await MarMooc.deleteMany({});
        console.log('Cleared existing MAR/MOOC entries.');

        // Get all students
        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} students.`);

        const marMoocEntries = [];

        for (const student of students) {
            // Assign 1 to 4 courses per student
            const numberOfCourses = getRandomInt(1, 4);

            for (let i = 0; i < numberOfCourses; i++) {
                const course = COURSES[getRandomInt(0, COURSES.length - 1)];
                const status = STATUSES[getRandomInt(0, STATUSES.length - 1)];

                let completionDate = null;
                let certificateUrl = null;

                if (status === 'Completed' || status === 'Verified') {
                    completionDate = new Date();
                    completionDate.setMonth(completionDate.getMonth() - getRandomInt(0, 12)); // Random past date
                    certificateUrl = `https://certificates.example.com/${student.rollNumber}/${i}`;
                }

                marMoocEntries.push({
                    student: student._id,
                    title: course.title,
                    platform: course.platform,
                    points: status === 'Verified' ? course.points : 0, // Points usually just for verified? Or maybe potential points. let's stick to verified having points counted.
                    status: status,
                    completionDate: completionDate,
                    certificateUrl: certificateUrl
                });
            }
        }

        if (marMoocEntries.length > 0) {
            await MarMooc.insertMany(marMoocEntries);
            console.log(`Successfully seeded ${marMoocEntries.length} MAR/MOOC entries.`);
        } else {
            console.log('No entries to seed (no students found?)');
        }

        process.exit(0);

    } catch (error) {
        console.error('Seeding MAR/MOOCs Failed:', error);
        process.exit(1);
    }
};

seedMarMoocs();
