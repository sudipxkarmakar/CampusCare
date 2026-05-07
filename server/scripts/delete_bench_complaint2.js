import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const complaintSchema = new mongoose.Schema({}, { strict: false, collection: 'complaints' });
const Complaint = mongoose.model('Complaint', complaintSchema);

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');
        
        const result = await Complaint.deleteMany({ 
            title: /Bench Broken/i,
            description: /need new one/i
        });
        
        console.log(`Successfully deleted ${result.deletedCount} matching complaints.`);
    } catch (e) {
        console.error('Error during deletion:', e);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}
run();
