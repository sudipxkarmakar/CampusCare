import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import dotenv from 'dotenv';
dotenv.config();

const fixComplaint = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare');
        const c = await Complaint.findOne({ title: 'mirror is broken in my hostel room' });
        if (c) {
            c.afterImage = '/uploads/cleaning_proof.png';
            await c.save();
            console.log('SUCCESS: Complaint updated with cleaning proof image.');
        } else {
            console.log('ERROR: Complaint not found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

fixComplaint();
