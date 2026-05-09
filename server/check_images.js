import mongoose from 'mongoose';
import 'dotenv/config';
import Complaint from './src/models/Complaint.js';

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const complaints = await Complaint.find({ image: { $exists: true, $ne: null } }).limit(5);
    console.log(JSON.stringify(complaints.map(c => ({ title: c.title, image: c.image })), null, 2));
    await mongoose.connection.close();
}

check();
