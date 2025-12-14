import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Routine from '../src/models/Routine.js';

dotenv.config();

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [
    { num: 1, start: '10:00 AM', end: '11:00 AM' },
    { num: 2, start: '11:00 AM', end: '12:00 PM' },
    { num: 3, start: '12:00 PM', end: '01:00 PM' },
    { num: 4, start: '02:00 PM', end: '03:00 PM' }, // Break 1-2
    { num: 5, start: '03:00 PM', end: '04:00 PM' },
];

const SUBJECTS_POOL = {
    'CSE': ['Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Networks', 'AI', 'Web Dev'],
    'ECE': ['Circuits', 'Signals', 'Digital Electronics', 'Microprocessors', 'Analog Comm', 'VLSI'],
    'ME': ['Thermodynamics', 'Mechanics', 'Fluid Dynamics', 'Manufacturing', 'CAD/CAM', 'Heat Transfer'],
    'CE': ['Structural Analysis', 'Geotech', 'Surveying', 'Transport Eng', 'Hydrology', 'Concrete Tech'],
    'EE': ['Power Systems', 'Control Systems', 'Machines', 'Circuit Theory', 'High Voltage', 'Power Electronics']
};

const BATCHES = ['2023', '2024', '2025'];
const SECTIONS = ['A', 'B'];
const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE'];

const getRandomInt = (max) => Math.floor(Math.random() * max);

const seedRoutines = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Clear existing routines
        await Routine.deleteMany({});
        console.log('Cleared existing Routines.');

        // Fetch all teachers grouped by department
        const teachersByDept = {};
        for (const dept of DEPARTMENTS) {
            teachersByDept[dept] = await User.find({ role: 'teacher', department: dept });
            console.log(`Loaded ${teachersByDept[dept].length} teachers for ${dept}`);
        }

        const routineEntries = [];

        // Generate Routine
        // Hierarchy: Dept -> Batch -> Section -> Day -> Period
        for (const dept of DEPARTMENTS) {
            const deptSubjects = SUBJECTS_POOL[dept];
            const deptTeachers = teachersByDept[dept];

            if (deptTeachers.length === 0) {
                console.warn(`Skipping ${dept} due to no teachers.`);
                continue;
            }

            for (const batch of BATCHES) {
                for (const section of SECTIONS) {
                    for (const day of DAYS) {
                        for (const period of PERIODS) {

                            // Pick a random subject
                            const subject = deptSubjects[getRandomInt(deptSubjects.length)];

                            // Pick a random teacher from the dept
                            // In real world, one teacher handles one subject, but for seeding random is okay
                            const teacher = deptTeachers[getRandomInt(deptTeachers.length)];

                            // Room allocation logic (mock)
                            // e.g. "Block-Room"
                            const room = `${dept.substring(0, 1)}-${100 + getRandomInt(10)}`;

                            routineEntries.push({
                                day: day,
                                period: period.num,
                                startTime: period.start,
                                endTime: period.end,
                                subject: subject,
                                teacher: teacher._id,
                                roomNumber: room,
                                batch: batch,
                                section: section,
                                department: dept
                            });
                        }
                    }
                }
            }
        }

        if (routineEntries.length > 0) {
            // Inserting in chunks to avoid message size limits if too huge, but ~5*3*2*5*5 = 750 docs. Safe.
            await Routine.insertMany(routineEntries);
            console.log(`Successfully seeded ${routineEntries.length} Routine slots.`);
        }

        process.exit(0);

    } catch (error) {
        console.error('Seeding Routine Failed:', error);
        process.exit(1);
    }
};

seedRoutines();
