import mongoose from 'mongoose';

// Initialize global MOCK_MODE
global.MOCK_MODE = false;

const connectDB = async () => {
    // 1. Check if URI is provided
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.warn('ℹ️  No MONGO_URI found in .env. Attempting default local connection...');
    }

    const connectionString = uri || 'mongodb://localhost:27017/campuscare';

    try {
        const conn = await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 3000, // Wait 3s max before falling back
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log('🚀 Running with REAL DATABASE');
        global.MOCK_MODE = false;

    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error.message}`);
        console.warn('⚠️  Database Unreachable. Falling back to MOCK MODE.');
        console.log('🎭 Running in MOCK MODE');
        global.MOCK_MODE = true;
    }
};

export default connectDB;
