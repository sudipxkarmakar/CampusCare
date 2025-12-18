import mongoose from 'mongoose';
import User from '../src/models/User.js';

const deleteTestUser = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/campuscare');
        console.log('Connected to MongoDB');

        const email = 'poytest1766073554299@test.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log(`Found user: ${user.name} (${user.email})`);
            await User.deleteOne({ _id: user._id });
            console.log('User deleted successfully.');
        } else {
            console.log('User not found.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
};

deleteTestUser();
