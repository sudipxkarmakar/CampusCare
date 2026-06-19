import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notice from '../src/models/Notice.js';
import User from '../src/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedHostelNotices = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding specific hostel notices');

        // Find a warden, admin, or teacher to be the poster
        let poster = await User.findOne({ role: { $in: ['warden', 'admin', 'teacher'] } });
        if (!poster) {
            // Fallback to any user
            poster = await User.findOne({});
        }

        const posterId = poster ? poster._id : new mongoose.Types.ObjectId();

        const notices = [
            {
                title: 'Hostel Cleaning Drive Notice',
                content: 'All hostel residents are hereby informed that a hostel cleaning drive has been scheduled to start this Saturday at 9:00 AM. Please participate actively to keep our living space tidy.',
                postedBy: posterId,
                audience: 'hosteler',
                date: new Date('2025-12-18T09:00:00')
            },
            {
                title: 'Christmas Tree Decoration Planning',
                content: 'All interested hostelers are invited to participate in the Christmas Tree Decoration planning meeting in the common room. Let\'s coordinate decorations and themes.',
                postedBy: posterId,
                audience: 'hosteler',
                date: new Date('2025-12-15T09:00:00')
            }
        ];

        for (const n of notices) {
            const exists = await Notice.findOne({ title: n.title });
            if (!exists) {
                await Notice.create(n);
                console.log(`+ Added notice: ${n.title}`);
            } else {
                console.log(`= Notice already exists: ${n.title}`);
            }
        }

        console.log('✅ Hostel notices seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to seed hostel notices:', error);
        process.exit(1);
    }
};

seedHostelNotices();
