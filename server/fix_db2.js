import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscare', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const db = mongoose.connection.db;
        const complaints = await db.collection('complaints').find({ category: 'Personal' }).toArray();
        let updateCount = 0;

        for (const c of complaints) {
            const lowerText = (c.title + ' ' + (c.description || '')).toLowerCase();
            
            const hasTheft = ['stolen', 'theft', 'robbery'].some(k => lowerText.includes(k));
            const hasLostOrMissing = ['lost', 'missing'].some(k => lowerText.includes(k));
            const hasValuables = ['phone', 'wallet', 'laptop', 'bag', 'chain', 'watch', 'jewellery', 'purse', 'gold', 'bracelet', 'ring', 'cash', 'money', 'cycle', 'scooter', 'charger', 'spectacles', 'specs', 'id card', 'keys'].some(k => lowerText.includes(k));
            
            if (hasTheft || (hasLostOrMissing && hasValuables)) {
                await db.collection('complaints').updateOne(
                    { _id: c._id },
                    { $set: { category: 'Disciplinary' } }
                );
                updateCount++;
                console.log(`Updated: ${c.title}`);
            }
        }
        
        console.log(`Finished updating ${updateCount} complaints.`);
        process.exit(0);
    });
