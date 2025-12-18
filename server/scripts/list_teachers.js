import mongoose from 'mongoose';
import User from '../src/models/User.js';

const listAllTeachers = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/campuscare');
        console.log('Connected to MongoDB');

        const teachers = await User.find({ role: 'teacher' }).select('name email _id');
        console.log(`Found ${teachers.length} teachers.`);

        teachers.forEach(t => {
            console.log(`ID: ${t._id}, Name: "${t.name}", Email: "${t.email}"`);
        });

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
};

listAllTeachers();
