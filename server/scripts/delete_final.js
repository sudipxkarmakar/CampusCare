
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Leave from '../src/models/Leave.js';

dotenv.config();

const deleteById = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const id = '69450274817feafa997c053b';
        console.log(`Deleting Leave ID: ${id}`);

        const result = await Leave.deleteOne({ _id: id });
        console.log(`Deleted count: ${result.deletedCount}`);

        mongoose.connection.close();
    } catch (error) {
        console.error(error);
        mongoose.connection.close();
    }
}
deleteById();
