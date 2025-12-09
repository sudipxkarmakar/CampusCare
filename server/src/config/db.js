import mongoose from 'mongoose';

// Global MOCK_MODE flag
global.MOCK_MODE = false;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare', {
            serverSelectionTimeoutMS: 2000 // Fail fast
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        global.MOCK_MODE = false;
    } catch (error) {
        console.error(`MongoDB Error: ${error.message}`);
        console.warn('⚠️  STARTING IN MOCK MODE (No Database Connection) ⚠️');
        global.MOCK_MODE = true;
        // process.exit(1); // Do NOT exit
    }
};

export default connectDB;
