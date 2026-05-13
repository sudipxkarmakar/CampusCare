import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import dotenv from 'dotenv';
dotenv.config();

const debugComplaint = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare');
        const c = await Complaint.findOne({ title: 'mirror is broken in my hostel room' });
        if (c) {
            console.log('ID:', c._id);
            console.log('Image (Before):', c.image);
            console.log('AfterImage (Current):', c.afterImage);
        } else {
            console.log('Complaint not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

debugComplaint();
