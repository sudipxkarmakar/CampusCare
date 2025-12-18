
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MessMenu from '../src/models/MessMenu.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyMess = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Create/Update a menu for Monday
        console.log('Upserting Monday Menu...');
        await MessMenu.findOneAndUpdate(
            { day: 'Monday' },
            {
                breakfast: 'Test Breakfast',
                lunch: 'Test Lunch',
                snacks: 'Test Snacks',
                dinner: 'Test Dinner'
            },
            { upsert: true, new: true }
        );

        // 2. Fetch using find (simulating getMessMenu)
        console.log('Fetching Menu...');
        const menu = await MessMenu.find({});
        console.log(`Found ${menu.length} entries.`);

        const monday = menu.find(m => m.day === 'Monday');
        if (monday && monday.breakfast === 'Test Breakfast') {
            console.log('Verification Successful: Monday menu matches.');
        } else {
            console.error('Verification Failed: Monday menu mismatch.');
            process.exit(1);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyMess();
