
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../src/models/Subject.js';
import User from '../src/models/User.js'; // To update dummy teachers with expertise

dotenv.config();

const subjectsData = [
    // 2026 Batch (4th Year)
    {
        academicYear: "2026",
        year: "4th Year",
        semester: 7,
        subjects: [
            { name: "Internet Technology", code: "IT701", credits: 3 },
            { name: "Cyber Security", code: "CS702", credits: 3 },
            { name: "Soft Skills", code: "HU701", credits: 2 },
            { name: "Project Management & Entrepreneurship", code: "HU702", credits: 3 }
        ]
    },
    {
        academicYear: "2026",
        year: "4th Year",
        semester: 8,
        subjects: [
            { name: "Cryptography", code: "CS801", credits: 3 },
            { name: "Network Security", code: "CS802", credits: 3 },
            { name: "Internet of Things", code: "CS803", credits: 3 }
        ]
    },
    // 2027 Batch (3rd Year)
    {
        academicYear: "2027",
        year: "3rd Year",
        semester: 5,
        subjects: [
            { name: "Software Engineering", code: "CS501", credits: 3 },
            { name: "Compiler Design", code: "CS502", credits: 3 },
            { name: "Operating Systems", code: "CS503", credits: 3 },
            { name: "Introduction to Industrial Management", code: "HU501", credits: 3 },
            { name: "Artificial Intelligence", code: "CS504", credits: 3 }
        ]
    },
    {
        academicYear: "2027",
        year: "3rd Year",
        semester: 6,
        subjects: [
            { name: "Database Management System", code: "CS601", credits: 3 },
            { name: "Computer Networks", code: "CS602", credits: 3 },
            { name: "Distributed System", code: "CS603", credits: 3 },
            { name: "Data Warehouse & Data Mining", code: "CS604", credits: 3 }
        ]
    },
    // 2028 Batch (2nd Year)
    {
        academicYear: "2028",
        year: "2nd Year",
        semester: 3,
        subjects: [
            { name: "Analog & Digital Electronics", code: "CS301", credits: 3 },
            { name: "Data Structures & Algorithms", code: "CS302", credits: 4 },
            { name: "Computer Organization", code: "CS303", credits: 3 },
            { name: "Differential Calculus", code: "BS301", credits: 3 },
            { name: "Economics for Engineers", code: "HU301", credits: 3 }
        ]
    },
    {
        academicYear: "2028",
        year: "2nd Year",
        semester: 4,
        subjects: [
            { name: "Discrete Mathematics", code: "M401", credits: 3 },
            { name: "Computer Architecture", code: "CS401", credits: 3 },
            { name: "Formal Languages & Automata Theory", code: "CS402", credits: 3 },
            { name: "Design & Analysis of Algorithms", code: "CS403", credits: 3 },
            { name: "Biology for Engineers", code: "BS401", credits: 3 },
            { name: "Environmental Science", code: "HU401", credits: 2 }
        ]
    },
    // 2029 Batch (1st Year)
    {
        academicYear: "2029",
        year: "1st Year",
        semester: 1,
        subjects: [
            { name: "Physics for Engineers", code: "PH101", credits: 3 },
            { name: "Chemistry for Engineers", code: "CH101", credits: 3 },
            { name: "Mathematics for Engineers", code: "M101", credits: 3 }
        ]
    },
    {
        academicYear: "2029",
        year: "1st Year",
        semester: 2,
        subjects: [
            { name: "Calculus & Integration", code: "M201", credits: 3 },
            { name: "Basic Electrical Engineering", code: "EE201", credits: 3 }
        ]
    }
];

const seedSubjects = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuscare");
        console.log("Connected to MongoDB for seeding...");

        // Clear existing subjects? Maybe risky if verified, but for this workflow, let's upsert or clear.
        // Given it's a specific "Create planning workflow", let's clear these specific academic years to be fresh.
        await Subject.deleteMany({ academicYear: { $in: ["2026", "2027", "2028", "2029"] } });
        console.log("Cleared existing subjects for 2026-2029.");

        const subjectDocs = [];

        for (const batch of subjectsData) {
            for (const sub of batch.subjects) {
                subjectDocs.push({
                    name: sub.name,
                    code: sub.code,
                    department: "IT", // Updated to match likely HOD department
                    year: batch.year,
                    semester: batch.semester,
                    credits: sub.credits,
                    academicYear: batch.academicYear
                });
            }
        }

        await Subject.insertMany(subjectDocs);
        console.log(`Seeded ${subjectDocs.length} subjects.`);

        // Update Dummy Teachers with Expertise
        // Let's add random expertise to existing teachers for demo
        const teachers = await User.find({ role: 'teacher' });
        const allSubjectNames = [...new Set(subjectDocs.map(s => s.name))];

        for (const teacher of teachers) {
            // Assign 3 random subjects as expertise
            const expertise = [];
            for (let i = 0; i < 3; i++) {
                const randSub = allSubjectNames[Math.floor(Math.random() * allSubjectNames.length)];
                if (!expertise.includes(randSub)) expertise.push(randSub);
            }
            teacher.expertise = expertise;
            await teacher.save();
        }
        console.log("Updated teachers with mock expertise.");

        process.exit();
    } catch (error) {
        console.error("Error seeding subjects:", error);
        process.exit(1);
    }
};

seedSubjects();
