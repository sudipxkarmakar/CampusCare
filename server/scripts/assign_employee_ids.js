import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const assignIds = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");
        await connectDB();

        console.log("🔄 Assigning Employee IDs...");

        // 1. Dean
        const dean = await User.findOne({ role: 'dean' });
        if (dean) {
            dean.employeeId = 'EMP-DEAN-01';
            await dean.save();
            console.log(`✅ Assigned ID to Dean: ${dean.name}`);
        }

        // 2. HODs
        const hods = await User.find({ role: 'hod' });
        let hCount = 1;
        for (const h of hods) {
            h.employeeId = `EMP-HOD-${String(hCount++).padStart(2, '0')}`;
            await h.save();
            console.log(`✅ Assigned ID to HOD: ${h.name} (${h.employeeId})`);
        }

        // 3. Teachers
        const teachers = await User.find({ role: 'teacher' });
        let tCount = 1;
        for (const t of teachers) {
            t.employeeId = `EMP-FAC-${String(tCount++).padStart(3, '0')}`;
            await t.save();
        }
        console.log(`✅ Assigned IDs to ${teachers.length} Teachers.`);

        // 4. Principal (if exists)
        const principal = await User.findOne({ role: 'principal' });
        if (principal) {
            principal.employeeId = 'EMP-PRIN-01';
            await principal.save();
            console.log(`✅ Assigned ID to Principal.`);
        } else {
            // Create Principal if missing? User mentioned Principal.
            const newPrincipal = await User.create({
                name: "Dr. Principal",
                email: "principal@campuscare.com", // Keeping email login consistent
                password: "password123",
                role: "principal",
                employeeId: "EMP-PRIN-01",
                designation: "Principal"
            });
            console.log(`✅ Created Principal: ${newPrincipal.name}`);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

assignIds();
