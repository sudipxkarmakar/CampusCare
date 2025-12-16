import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AcademicLeader from '../src/models/AcademicLeader.js';

dotenv.config();

const verifyAcademicLeaders = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        const leaders = await AcademicLeader.find({}).sort({ priority: 1 });
        console.log(`Found ${leaders.length} Academic Leaders:`);
        leaders.forEach(l => {
            console.log(`- ${l.role}: ${l.name} (${l.department || 'General'})`);
        });

        if (leaders.length === 0) {
            console.log('❌ No leaders found. Run seed script!');
        } else {
            console.log('✅ Verification Successful');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
};

verifyAcademicLeaders();
