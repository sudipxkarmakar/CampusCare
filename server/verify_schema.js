import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import dotenv from 'dotenv';
dotenv.config();

const verifySchema = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare');
        console.log('Schema Paths:', Object.keys(Complaint.schema.paths));
        
        // Also check if any complaint has afterImage
        const complaintsWithImage = await Complaint.find({ afterImage: { $exists: true } });
        console.log('Complaints with afterImage count:', complaintsWithImage.length);
        if (complaintsWithImage.length > 0) {
            console.log('Sample afterImage:', complaintsWithImage[0].afterImage);
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

verifySchema();
