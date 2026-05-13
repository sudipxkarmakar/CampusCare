import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import dotenv from 'dotenv';
dotenv.config();

const updateComplaint = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare');
        const c = await Complaint.findOne({ title: 'mirror is broken in my hostel room' });
        if (c) {
            c.afterImage = '/uploads/1778333434630.png'; // Using an existing image as proof
            await c.save();
            console.log('SUCCESS: Complaint updated with proof image.');
        } else {
            console.log('ERROR: Complaint not found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

updateComplaint();
