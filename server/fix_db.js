import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscare', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const db = mongoose.connection.db;
        await db.collection('complaints').updateMany(
            { category: 'Personal', title: /gold bracelet/i },
            { $set: { category: 'Disciplinary' } }
        );
        console.log('Updated');
        process.exit(0);
    });
