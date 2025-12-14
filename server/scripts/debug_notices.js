import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';

dotenv.config();

const debugNotices = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Emulate the controller inputs
        const role = 'student';
        const userId = 'dummy_id_123'; // Logic should work even with dummy ID for general notices

        // Logic from Controller
        let audienceList = ['general', 'public'];
        if (role === 'teacher') audienceList.push('teacher');
        if (role === 'student') audienceList.push('student');
        if (role === 'hosteler') audienceList.push('student', 'hosteler');

        const query = {
            $or: [
                { audience: { $in: audienceList } },
                ...(userId ? [{ postedBy: userId }] : [])
            ]
        };

        console.log('Query being executed:', JSON.stringify(query, null, 2));

        const notices = await Notice.find(query).sort({ date: -1 }).limit(20);

        console.log(`Found ${notices.length} matching notices.`);
        notices.forEach(n => console.log(`- [${n.audience}] ${n.title} (postedBy: ${n.postedBy})`));

        // Also check if ANY notices exist at all
        const allNotices = await Notice.countDocuments({});
        console.log(`\nTotal notices in DB: ${allNotices}`);

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

debugNotices();
