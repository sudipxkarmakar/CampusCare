import mongoose from 'mongoose';
import Complaint from './src/models/Complaint.js';
import User from './src/models/User.js';

const MONGO_URI = 'mongodb+srv://skmultiverse:skmultiverse@cluster0.y46rdtn.mongodb.net/campuscare?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
  
  const complaints = await Complaint.find({}).populate('student').lean();
  console.log(`Found ${complaints.length} complaints.`);
  
  for (const c of complaints.slice(0, 10)) {
    console.log(`ID: ${c._id}`);
    console.log(`Title: ${c.title}`);
    console.log(`Student populated:`, c.student ? { _id: c.student._id, name: c.student.name, role: c.student.role } : null);
    console.log(`-----------------------------`);
  }
  
  process.exit(0);
}

run().catch(console.error);
