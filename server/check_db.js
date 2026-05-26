import mongoose from 'mongoose';

async function run() {
    try {
        await mongoose.connect('mongodb+srv://skmultiverse:skmultiverse@cluster0.y46rdtn.mongodb.net/campuscare?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Connected to MongoDB');
        
        const total = await mongoose.connection.db.collection('users').countDocuments({});
        console.log('Total Users:', total);

        const roles = await mongoose.connection.db.collection('users').aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]).toArray();
        console.log('Roles:', roles);

        const hostelers = await mongoose.connection.db.collection('users').countDocuments({
            hostelName: { $exists: true, $ne: '' }
        });
        console.log('Users with hostelName:', hostelers);

        const hostelerRole = await mongoose.connection.db.collection('users').countDocuments({
            role: 'hosteler'
        });
        console.log('Users with role hosteler:', hostelerRole);

        const sampleWarden = await mongoose.connection.db.collection('users').findOne({ role: 'warden' });
        console.log('Sample Warden:', sampleWarden ? { name: sampleWarden.name, email: sampleWarden.email, hostelName: sampleWarden.hostelName } : 'None');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
