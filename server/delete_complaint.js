import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const deleteComplaint = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare');
        console.log('MongoDB Connected');

        const title = "IOS Power bank is left";

        const complaint = await Complaint.findOne({ title: title });

        if (complaint) {
            console.log('Found complaint:', JSON.stringify(complaint, null, 2));
            await Complaint.findByIdAndDelete(complaint._id);
            console.log('Complaint deleted successfully.');
        } else {
            console.log('Complaint not found.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

deleteComplaint();
