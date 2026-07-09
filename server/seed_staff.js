import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const supportStaffList = [
    {
        name: 'Ramesh Kumar (Plumber)',
        email: 'plumber@campus.com',
        role: 'staff',
        designation: 'Plumber'
    },
    {
        name: 'Suresh Singh (Electrician)',
        email: 'electrician@campus.com',
        role: 'staff',
        designation: 'Electrician'
    },
    {
        name: 'Amit Verma (Lift Tech)',
        email: 'lifttech@campus.com',
        role: 'staff',
        designation: 'Lift / Elevator Technician'
    },
    {
        name: 'Rajesh Sharma (AC Tech)',
        email: 'actech@campus.com',
        role: 'staff',
        designation: 'HVAC / AC Technician'
    },
    {
        name: 'Vikram Carpenter',
        email: 'carpenter@campus.com',
        role: 'staff',
        designation: 'Carpenter'
    },
    {
        name: 'Madan Lal (Mason)',
        email: 'civilmaintenance@campus.com',
        role: 'staff',
        designation: 'Mason / Painter (Civil Maintenance)'
    },
    {
        name: 'Nitin Gupta (Sys Admin)',
        email: 'networkadmin@campus.com',
        role: 'staff',
        designation: 'Network / System Administrator (IT Support)'
    },
    {
        name: 'Sunil Dutt (Mess Manager)',
        email: 'messmanager@campus.com',
        role: 'staff',
        designation: 'Mess / Catering Manager'
    },
    {
        name: 'Karan Singh (Housekeeping)',
        email: 'housekeeping@campus.com',
        role: 'staff',
        designation: 'Housekeeping & Janitorial Supervisor'
    },
    {
        name: 'Vijay Pestcontrol',
        email: 'pestcontrol@campus.com',
        role: 'staff',
        designation: 'Pest Control Specialist'
    },
    {
        name: 'Anil CSE Lab (Assistant)',
        email: 'cselab@campus.com',
        role: 'staff',
        designation: 'Lab Assistants / Attendants',
        department: 'CSE'
    },
    {
        name: 'Sunil IT Lab (Assistant)',
        email: 'itlab@campus.com',
        role: 'staff',
        designation: 'Lab Assistants / Attendants',
        department: 'IT'
    },
    {
        name: 'Ravi ECE Lab (Assistant)',
        email: 'ecelab@campus.com',
        role: 'staff',
        designation: 'Lab Assistants / Attendants',
        department: 'ECE'
    },
    {
        name: 'Arjun Mech Lab (Assistant)',
        email: 'mechlab@campus.com',
        role: 'staff',
        designation: 'Lab Assistants / Attendants',
        department: 'Mech'
    },
    {
        name: 'Satnam Singh (CSO)',
        email: 'securityofficer@campus.com',
        role: 'staff',
        designation: 'Chief Security Officer / Guard Desk'
    },
    {
        name: 'Harish Grounds Manager',
        email: 'groundsmanager@campus.com',
        role: 'staff',
        designation: 'Estate / Grounds Manager'
    }
];

const seedStaff = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        console.log(`Connecting to database: ${mongoURI}`);
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected successfully.');

        let createdCount = 0;
        let updatedCount = 0;

        for (const staff of supportStaffList) {
            const exists = await User.findOne({ email: staff.email });
            if (exists) {
                exists.name = staff.name;
                exists.role = staff.role;
                exists.designation = staff.designation;
                exists.contactNumber = '6294283929';
                if (staff.department) {
                    exists.department = staff.department;
                }
                await exists.save();
                updatedCount++;
            } else {
                const employeeId = 'STF-' + Math.floor(1000 + Math.random() * 9000);
                await User.create({
                    ...staff,
                    password: 'password123',
                    contactNumber: '6294283929',
                    employeeId
                });
                createdCount++;
            }
        }

        console.log(`Seeding Done. Created: ${createdCount}, Updated: ${updatedCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedStaff();
