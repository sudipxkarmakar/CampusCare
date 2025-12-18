import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyPic = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find the user "IT Student 1" - usually roll 1001 based on screenshot
        // Or broad search
        const user = await User.findOne({ rollNumber: '1001' });

        if (user) {
            console.log('User Found:', user.name);
            console.log('Profile Picture Field:', user.profilePicture);
        } else {
            console.log('User 1001 not found. Listing all users with profile pics:');
            const users = await User.find({ profilePicture: { $exists: true, $ne: null } });
            users.forEach(u => console.log(`${u.name} (${u.role}): ${u.profilePicture}`));
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyPic();
