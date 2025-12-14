import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Complaint from '../src/models/Complaint.js';

dotenv.config();

const CATEGORIES = ['Electrical', 'Sanitation', 'Civil', 'IT', 'Mess', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedComplaints = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Clear existing complaints
        await Complaint.deleteMany({});
        console.log('Cleared existing Complaints.');

        // Get all students
        const students = await User.find({ role: 'student' });

        const complaints = [];

        for (const student of students) {
            // 30% chance a student has a complaint
            if (Math.random() > 0.7) {
                const numberOfComplaints = getRandomInt(1, 2);

                for (let i = 0; i < numberOfComplaints; i++) {
                    complaints.push({
                        title: `Issue regarding ${CATEGORIES[getRandomInt(0, CATEGORIES.length - 1)]}`,
                        description: `This is a sample complaint description from ${student.name}. Please resolve ASAP.`,
                        category: CATEGORIES[getRandomInt(0, CATEGORIES.length - 1)],
                        priority: PRIORITIES[getRandomInt(0, PRIORITIES.length - 1)],
                        status: 'Submitted',
                        student: student._id
                    });
                }
            }
        }

        if (complaints.length > 0) {
            await Complaint.insertMany(complaints);
            console.log(`Successfully seeded ${complaints.length} Complaints.`);
        }

        process.exit(0);

    } catch (error) {
        console.error('Seeding Complaints Failed:', error);
        process.exit(1);
    }
};

seedComplaints();
