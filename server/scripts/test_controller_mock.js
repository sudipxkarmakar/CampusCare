
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDepartmentStudents } from '../src/controllers/hodController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const testController = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const req = {
            user: {
                department: 'IT'
            }
        };

        const res = {
            status: (code) => {
                console.log(`Status: ${code}`);
                return res;
            },
            json: (data) => {
                console.log("--- CONTROLLER JSON RESPONSE ---");
                // Find one with a mentor
                const withMentor = data.find(s => s.mentorName);
                if (withMentor) {
                    console.log("Found student with mentor:");
                    console.log(JSON.stringify(withMentor, null, 2));
                } else {
                    console.log("No students with mentorName found in response.");
                    // Show one sample anyway
                    console.log("Sample student:", JSON.stringify(data[0], null, 2));
                }
            }
        };

        console.log("Calling getDepartmentStudents...");
        await getDepartmentStudents(req, res);

        console.log("Done.");
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

testController();
