
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const clearDefaults = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Unset bloodGroup and contactNumber for all students/hostelers
        // effectively removing the field if it was set to the default value we added.
        // Or simply unset for ALL students to be clean as per user execution.

        // We will target the specific values we added to avoid deleting real data if any exists (though unlikely given previously empty).
        // The values were: bloodGroup: 'B+', contactNumber: '+91 98765 43210' (from step 226/234)

        const result = await User.updateMany(
            {
                role: { $in: ['student', 'hosteler'] },
                bloodGroup: 'B+',
                contactNumber: '+91 98765 43210'
            },
            {
                $unset: { bloodGroup: "", contactNumber: "" }
            }
        );

        console.log(`Cleared defaults for ${result.modifiedCount} students.`);

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

clearDefaults();
