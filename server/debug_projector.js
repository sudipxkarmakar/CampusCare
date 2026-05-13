import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import dotenv from 'dotenv';
dotenv.config();

const debugProjector = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare');
        const c = await Complaint.findOne({ title: { $regex: /projector/i } });
        if (c) {
            console.log('ID:', c._id);
            console.log('Status:', c.status);
            console.log('AfterImage:', c.afterImage);
        } else {
            console.log('Complaint not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

debugProjector();
