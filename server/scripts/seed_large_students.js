import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const FIXED_USERS = {
    1: "Sudip Karmakar",
    2: "Amit Prasad",
    3: "Komal Kumari Thakur",
    4: "Sumit Modi"
};

const getRole = (i) => {
    // pattern: 25 group.
    // 1-20: student
    // 21-25: hosteler
    // i % 25. 
    // If remainder is 1..20 -> Student.
    // If remainder is 21..24, 0 -> Hosteler.
    const rem = i % 25;
    if (rem >= 1 && rem <= 20) return 'student';
    return 'hosteler';
};

const generateStudents = async () => {
    try {
        await connectDB();
        console.log("🚀 Starting Bulk Seed...");

        // Optional: clear existing again?
        // await User.deleteMany({}); 

        const usersToInsert = [];

        for (let i = 1; i <= 1200; i++) {
            const role = getRole(i);
            const name = FIXED_USERS[i] || `${role === 'hosteler' ? 'Hosteler' : 'Student'} ${i}`;
            const rollNumber = i.toString(); // "1", "2", ...

            const userData = {
                name: name,
                email: `${role}${i}@campuscare.com`, // uniform emails
                password: "password123", // Default password
                role: role,
                department: "CSE", // Defaulting to CSE
                rollNumber: rollNumber,
                batch: "2024",
                passOutYear: "2028",
                contactNumber: "9876543210",
                bloodGroup: "O+",
            };

            if (role === 'student') {
                userData.section = "A"; // Default section
            } else if (role === 'hosteler') {
                userData.hostelName = "Boys Hostel 1";
                userData.roomNumber = "101";
                userData.batch = "2024"; // Required by validation
            }

            usersToInsert.push(userData);
        }

        console.log(`Prepared ${usersToInsert.length} users. Bulk inserting...`);

        // Use insertMany for performance
        // ordered: false allows continuing even if duplicates (though we cleared)
        await User.insertMany(usersToInsert, { ordered: false });

        console.log(`✅ Successfully seeded ${usersToInsert.length} users!`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

generateStudents();
