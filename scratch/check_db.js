const mongoose = require('mongoose');

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

        const students = await mongoose.connection.db.collection('users').find({
            role: { $in: ['student', 'hosteler'] }
        }).toArray();
        console.log('Sample students/hostelers hostelName:', students.map(s => ({
            name: s.name,
            role: s.role,
            hostelName: s.hostelName,
            roomNumber: s.roomNumber
        })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
