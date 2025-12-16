import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Subject from '../src/models/Subject.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUBJECT_MAP = {
    '1st Year': ['Engineering Mathematics-I', 'Engineering Physics', 'Basic Electrical Engg', 'Engineering Mechanics'],
    '2nd Year': ['Data Structures & Algo', 'Digital Logic Design', 'Computer Organization', 'Discrete Mathematics'],
    '3rd Year': ['Operating Systems', 'Database Mgmt Systems', 'Computer Networks', 'Software Engineering'],
    '4th Year': ['Artificial Intelligence', 'Cloud Computing', 'Information Security', 'Major Project']
};

const renameSubjects = async () => {
    try {
        await connectDB();
        console.log("🚀 Renaming Subjects to Realistic Names...");

        const depts = ['CSE', 'IT', 'AIML'];

        for (const dept of depts) {
            // Find 16 subjects for this dept
            const subjects = await Subject.find({ department: dept }).sort({ code: 1 });

            // We expect sorted by code: 101-104 (1st yr), 201-204 (2nd yr), 301-304 (3rd), 401-404 (4th)
            // But my generation script might have varied code logic or sorting.
            // Let's filter by year instead to be safe.

            for (const year of ['1st Year', '2nd Year', '3rd Year', '4th Year']) {
                const yearSubs = subjects.filter(s => s.year === year);
                const realNames = SUBJECT_MAP[year];

                for (let i = 0; i < yearSubs.length; i++) {
                    if (realNames[i]) {
                        // Keep prefix to distinguish depts slightly if needed, or just use raw name?
                        // User wants "Real". "Data Structures" is real. "CSE Data Structures" is okay.
                        // Let's use raw name but maybe append Dept if it helps, strictly speaking "Data Structures" is best.

                        await Subject.findByIdAndUpdate(yearSubs[i]._id, {
                            name: realNames[i]
                        });
                        console.log(`Updated ${yearSubs[i].code} -> ${realNames[i]}`);
                    }
                }
            }
        }

        console.log("\n✅ Subjects Renamed Successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

renameSubjects();
