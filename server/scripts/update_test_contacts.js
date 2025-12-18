
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const updateContacts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const hostelers = await User.find({ role: 'hosteler' });
        console.log(`Found ${hostelers.length} hostelers.`);

        if (hostelers.length === 0) {
            console.log('No hostelers found.');
            process.exit(0);
        }

        let updatedCount = 0;
        for (const user of hostelers) {
            if (!user.contactNumber) {
                // Generate a random 10-digit number for testing
                const randomPhone = '9' + Math.floor(100000000 + Math.random() * 900000000);
                user.contactNumber = randomPhone;
                await user.save();
                console.log(`Updated ${user.name} with contact: ${randomPhone}`);
                updatedCount++;
            }
        }

        console.log(`Updated ${updatedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateContacts();
