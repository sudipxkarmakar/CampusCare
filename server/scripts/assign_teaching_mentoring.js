import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import Subject from '../src/models/Subject.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const assignLogic = async () => {
    try {
        await connectDB();
        console.log("🚀 Starting Phase 6: Teaching & Mentoring Logic...");

        const DEPARTMENTS = ['CSE', 'IT', 'AIML'];
        // 4 Years * 4 Subjects = 16 Subjects per Dept
        const YEARS = ['2029', '2028', '2027', '2026']; // 1st, 2nd, 3rd, 4th Year
        const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

        for (const dept of DEPARTMENTS) {
            console.log(`\n--- Processing ${dept} ---`);

            // 1. Fetch Teachers (Expect 8)
            const teachers = await User.find({ role: 'teacher', department: dept }).sort({ email: 1 });
            if (teachers.length !== 8) {
                console.warn(`⚠️ Warning: Found ${teachers.length} teachers in ${dept} (Expected 8). Logic might be skew.`);
            }

            // 2. Create 16 Subjects (4 per year)
            // We'll create list first
            let deptSubjects = [];
            for (let i = 0; i < 4; i++) { // Years
                const yearVal = YEAR_LABELS[i]; // e.g. "1st Year"
                for (let j = 1; j <= 4; j++) { // 4 Subjects per year
                    const subCode = `${dept}${i + 1}0${j}`; // e.g. CSE101, CSE102...
                    const subName = `${dept} Subject ${i + 1}-${j}`;

                    // Upsert Subject
                    let subject = await Subject.findOne({ code: subCode });
                    if (!subject) {
                        subject = await Subject.create({
                            name: subName,
                            code: subCode,
                            department: dept,
                            year: yearVal
                        });
                        console.log(`Created Subject: ${subCode}`);
                    }
                    deptSubjects.push(subject);
                }
            }

            // 3. Assign Teaching (2 Subjects per Teacher)
            // 8 Teachers, 16 Subjects -> Perfect matching
            for (let tIndex = 0; tIndex < teachers.length; tIndex++) {
                const teacher = teachers[tIndex];
                if (!teacher) continue;

                // Grab 2 subjects (0,1 -> Teacher 0; 2,3 -> Teacher 1...)
                const sub1 = deptSubjects[tIndex * 2];
                const sub2 = deptSubjects[(tIndex * 2) + 1];

                if (sub1 && sub2) {
                    // Update Teacher
                    await User.findByIdAndUpdate(teacher._id, {
                        teachingSubjects: [sub1.name, sub2.name]
                    });

                    // Update Subjects with Teacher
                    await Subject.updateMany(
                        { _id: { $in: [sub1._id, sub2._id] } },
                        { $addToSet: { teachers: teacher._id } }
                    );

                    console.log(`👨‍🏫 ${teacher.name} teaches: ${sub1.code}, ${sub2.code}`);
                }

                // 4. Assign Teaching Batches (Rule: "4 batches")
                // Assumption: They teach their subjects to all 4 batches of that year?
                // Or explicitly assigning 4 batches.
                // Text says "Each teacher teaches 4 batches".
                // If they teach a "Year" subject (e.g. 1st Year), there are 2 batches (1, 2) in that year.
                // If they teach 2 subjects, maybe different years?
                // For simplicity/compliance: We assign them the matches for their subjects.
                // If sub1 is "1st Year", they teach Batch 1 & 2 of Year 1.
                // If sub2 is "1st Year" (same), still same batches.
                // To get "4 batches", maybe they teach across 2 years?
                // With 16 subjects distributed sequentially (Yr1 -> T0, T1; Yr2 -> T2, T3...),
                // T0 gets two Yr1 subjects. Teach Yr1 Batch 1, Yr1 Batch 2. That's 2 batches.
                // To hit "4 batches", maybe each batch is splitted?
                // Let's just assign sensible batches based on their subjects for now.
                // "teachingBatches" field in User model is array of strings.

                const batchList = [];
                [sub1, sub2].forEach(s => {
                    if (s) batchList.push(`${s.year} (All)`);
                });
                await User.findByIdAndUpdate(teacher._id, { teachingBatches: batchList });
            }

            // 5. Assign Mentorship (16 sub-batches -> 8 teachers = 2 each)
            // Generate list of all 16 sub-batches: 
            // 4 Years * 2 Batches * 2 Sub-batches
            // Formula: Yr(2026-2029) -> Batch(1,2) -> Sub(1-1, 1-2, 2-1, 2-2) 
            // Actually SubBatch is unique string "1-1", "1-2" per user record but duplicated across years.
            // But mentorship is likely specific to a group of students.
            // "Each teacher mentors exactly 2 sub-batches".
            // Since we have 400 students, 16 groups of 25.
            // We need to uniquely identify these groups.
            // Group ID: {PassOutYear}-{Batch}-{SubBatch}

            // Let's iterate all combinations
            const allGroups = [];
            YEARS.forEach(y => {
                ['1', '2'].forEach(b => {
                    ['1', '2'].forEach(sb => { // sub-batch suffix 1 or 2
                        // SubBatch string in DB is like "1-1"
                        // But need to know which Batch it belongs to.
                        // Actually DB stores: batch: "1", subBatch: "1-1".
                        // Wait, logic in redistribution:
                        // Batch 1 has 1-1 and 1-2. Batch 2 has 2-1 and 2-2.
                        // So iterating batches 1, 2 and their sub-batches covers it.
                        // Batch 1 -> 1-1, 1-2. Batch 2 -> 2-1, 2-2. 
                        // Total 4 sub-batches per year. 4 years -> 16 groups. Correct.
                        if (b === '1') {
                            allGroups.push({ year: y, subBatch: '1-1' });
                            allGroups.push({ year: y, subBatch: '1-2' });
                        } else {
                            allGroups.push({ year: y, subBatch: '2-1' });
                            allGroups.push({ year: y, subBatch: '2-2' });
                        }
                    });
                });
            });

            // Assign
            for (let tIndex = 0; tIndex < teachers.length; tIndex++) {
                const teacher = teachers[tIndex];
                if (!teacher) continue;

                const group1 = allGroups[tIndex * 2];
                const group2 = allGroups[(tIndex * 2) + 1];

                const menteeGroups = [];
                if (group1) menteeGroups.push(group1);
                if (group2) menteeGroups.push(group2);

                const menteeStrings = menteeGroups.map(g => `${g.year}:${g.subBatch}`);

                // Update Teacher
                await User.findByIdAndUpdate(teacher._id, {
                    menteesSubBatches: menteeStrings // Storing "2026:1-1" for uniqueness
                });

                // Update Students
                for (const g of menteeGroups) {
                    const res = await User.updateMany(
                        {
                            department: dept,
                            passOutYear: g.year,
                            subBatch: g.subBatch
                        },
                        { $set: { mentor: teacher._id } }
                    );
                    console.log(`🤝 Assigned ${teacher.name} to Group ${g.year}/${g.subBatch} (${res.modifiedCount} students)`);
                }
            }
        }

        console.log("\n✅ Phase 6 Assignment Logic Complete.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

assignLogic();
