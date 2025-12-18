
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUBJECT_CATALOG = [
    "Internet Technology", "Cyber Security", "Soft Skills", "Project Management & Entrepreneurship",
    "Cryptography", "Network Security", "Internet of Things",
    "Software Engineering", "Compiler Design", "Operating Systems", "Introduction to Industrial Management", "Artificial Intelligence",
    "Database Management System", "Computer Networks", "Distributed System", "Data Warehouse & Data Mining",
    "Analog & Digital Electronics", "Data Structures & Algorithms", "Computer Organization", "Differential Calculus", "Economics for Engineers",
    "Discrete Mathematics", "Computer Architecture", "Formal Languages & Automata Theory", "Design & Analysis of Algorithms", "Biology for Engineers", "Environmental Science",
    "Physics for Engineers", "Chemistry for Engineers", "Mathematics for Engineers",
    "Calculus & Integration", "Basic Electrical Engineering"
];

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const teachers = await User.find({ role: 'teacher' });
        console.log(`Found ${teachers.length} teachers.`);

        const coverage = {};
        SUBJECT_CATALOG.forEach(s => coverage[s] = 0);

        teachers.forEach(t => {
            console.log(`${t.name} expertise:`, t.expertise);
            if (t.expertise) {
                t.expertise.forEach(sub => {
                    if (coverage[sub] !== undefined) {
                        coverage[sub]++;
                    }
                });
            }
        });

        console.log("\n--- Coverage Report ---");
        let fail = false;
        for (const [sub, count] of Object.entries(coverage)) {
            if (count < 2) {
                console.log(`❌ ${sub}: ${count} experts (Target: 2+)`);
                fail = true;
            } else {
                // console.log(`✅ ${sub}: ${count} experts`);
            }
        }

        if (!fail) {
            console.log("✅ SUCCESS: All subjects have at least 2 experts.");
        } else {
            console.log("❌ FAILURE: Some subjects are under-covered.");
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verify();
