import mongoose from 'mongoose';
import User from './src/models/User.js';

const MONGO_URI = 'mongodb://skmultiverse:skmultiverse@ac-evrcra0-shard-00-00.y46rdtn.mongodb.net:27017,ac-evrcra0-shard-00-01.y46rdtn.mongodb.net:27017,ac-evrcra0-shard-00-02.y46rdtn.mongodb.net:27017/campuscare?ssl=true&authSource=admin&retryWrites=true&w=majority';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
  
  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users.`);
  
  for (const u of users) {
    console.log(`ID: ${u._id}`);
    console.log(`Name: ${u.name}`);
    console.log(`Email: ${u.email}`);
    console.log(`Role: ${u.role}`);
    console.log(`-----------------------------`);
  }
  
  process.exit(0);
}

run().catch(console.error);
