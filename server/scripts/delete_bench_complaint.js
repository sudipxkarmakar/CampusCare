import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '../.env') });

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';

const ComplaintSchema = new mongoose.Schema({}, { strict: false, collection: 'complaints' });
const Complaint = mongoose.model('Complaint', ComplaintSchema);

async function run() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');
        
        const result = await Complaint.deleteMany({ title: "Bench is broken" });
        console.log('Delete result:', result);
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
