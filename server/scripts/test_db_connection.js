import mongoose from 'mongoose';

const uri = "mongodb+srv://skmultiverse:skmultiverse@cluster0.y46rdtn.mongodb.net/?appName=Cluster0";

console.log("Attempting to connect with 3s timeout...");
const startTime = Date.now();

mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
    .then(() => {
        const duration = Date.now() - startTime;
        console.log(`Successfully connected in ${duration}ms`);
        process.exit(0);
    })
    .catch((err) => {
        const duration = Date.now() - startTime;
        console.error(`Connection failed in ${duration}ms`);
        console.error("Error:", err.message);
        process.exit(1);
    });
