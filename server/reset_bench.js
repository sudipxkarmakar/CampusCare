import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import dotenv from 'dotenv';
dotenv.config();

const resetComplaint = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare');
        const c = await Complaint.findOne({ title: { $regex: /bench/i } });
        if (c) {
            c.status = 'Submitted';
            c.afterImage = undefined;
            await c.save();
            console.log('SUCCESS: Bench complaint reset to Submitted.');
        } else {
            console.log('ERROR: Complaint not found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

resetComplaint();
