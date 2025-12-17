
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import MarMooc from '../src/models/MarMooc.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Mock Response Object
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const verifySubmissionFlow = async () => {
    try {
        await connectDB();
        console.log("\n🚀 Starting MAR/MOOC Submission Verification...\n");

        // 1. Setup User
        const student = await User.findOne({ rollNumber: '1001' });
        if (!student) throw new Error("Student 1001 not found");
        console.log(`👤 Testing as: ${student.name} (${student.rollNumber})`);

        // Dynamic Import of Controller
        const { submitMarMooc } = await import('../src/controllers/marMoocController.js');

        // TEST 1: Submit Valid MAR (Should Success)
        console.log("\n🧪 Test 1: Submit New MAR Activity (Health Camp)");
        const req1 = {
            user: student,
            body: {
                category: 'mar',
                title: 'Health Camp Volunteer',
                platform: 'NSS',
                points: 10,
                link: 'health_camp.pdf'
            }
        };
        const res1 = mockRes();
        await submitMarMooc(req1, res1);

        if (res1.statusCode === 201) {
            console.log("✅ PASS: Successfully submitted.");
        } else {
            console.log("❌ FAIL:", res1.data);
        }

        // TEST 2: Submit Duplicate (Should Fail)
        console.log("\n🧪 Test 2: Submit Same Activity Again (Health Camp)");
        const res2 = mockRes();
        await submitMarMooc(req1, res2);

        if (res2.statusCode === 400 && res2.data.message.includes('already submitted')) {
            console.log(`✅ PASS: Correctly blocked duplicate. Msg: "${res2.data.message}"`);
        } else {
            console.log("❌ FAIL: Did not block duplicate.", res2.statusCode, res2.data);
        }

        // TEST 3: Submit Valid MOOC (Should Success)
        console.log("\n🧪 Test 3: Submit New MOOC (React Native)");
        const req3 = {
            user: student,
            body: {
                category: 'mooc',
                title: 'React Native Advanced',
                platform: 'Udemy',
                points: 20, // High points for MOOC
                link: 'udemy_cert.pdf'
            }
        };
        const res3 = mockRes();
        await submitMarMooc(req3, res3);

        if (res3.statusCode === 201) {
            console.log("✅ PASS: Successfully submitted MOOC.");
        } else {
            console.log("❌ FAIL:", res3.data);
        }

        // TEST 4: Verify Database State
        console.log("\n🔍 Verifying Database Records...");
        const records = await MarMooc.find({ student: student._id }).sort({ createdAt: -1 });
        const recentMar = records.find(r => r.title === 'Health Camp Volunteer');
        const recentMooc = records.find(r => r.title === 'React Native Advanced');

        if (recentMar && recentMooc) {
            console.log("✅ PASS: Both records exist in DB.");
            console.log(`   - MAR: ${recentMar.title} (${recentMar.status})`);
            console.log(`   - MOOC: ${recentMooc.title} (${recentMooc.status})`);
            process.exit(0);
        } else {
            console.log("❌ FAIL: Records not found in DB.");
            process.exit(1);
        }

    } catch (e) {
        console.error("❌ ERROR:", e);
        process.exit(1);
    }
};

verifySubmissionFlow();
