import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AcademicLeader from '../src/models/AcademicLeader.js';

dotenv.config();

const leaders = [
    {
        name: 'Dr. S. K. Sharma',
        role: 'Principal',
        qualification: 'Ph.D. in Mechanical Engineering',
        experience: '30 Years',
        email: 'principal@campus.com',
        image: 'https://ui-avatars.com/api/?name=S+K+Sharma&background=0D8ABC&color=fff',
        message: 'Welcome to our institution. We strive for excellence in education and character building.',
        priority: 1
    },
    {
        name: 'Prof. Anjali Gupta',
        role: 'Vice Principal',
        qualification: 'M.Tech, Ph.D. in Physics',
        experience: '22 Years',
        email: 'vp@campus.com',
        image: 'https://ui-avatars.com/api/?name=Anjali+Gupta&background=example&color=fff',
        message: 'Discipline and dedication are the keys to success.',
        priority: 2
    },
    {
        name: 'Dr. R. K. Das',
        role: 'Dean of Academics',
        qualification: 'Ph.D. in Education',
        experience: '25 Years',
        email: 'dean.academics@campus.com',
        priority: 3
    },
    {
        name: 'Dr. Amit Patel',
        role: 'HOD',
        department: 'CSE',
        qualification: 'Ph.D. in Computer Science',
        experience: '18 Years',
        email: 'hod.cse@campus.com',
        message: 'Innovation differentiates a leader from a follower.',
        priority: 5
    },
    {
        name: 'Prof. Priya Singh',
        role: 'HOD',
        department: 'ECE',
        qualification: 'M.Tech in VLSI',
        experience: '15 Years',
        email: 'hod.ece@campus.com',
        priority: 5
    },
    {
        name: 'Dr. Manoj Kumar',
        role: 'HOD',
        department: 'Civil',
        qualification: 'Ph.D. in Structural Engg',
        experience: '20 Years',
        email: 'hod.civil@campus.com',
        priority: 5
    },
    {
        name: 'Prof. S. N. Ray',
        role: 'HOD',
        department: 'Mechanical',
        qualification: 'M.Tech in Robotics',
        experience: '17 Years',
        email: 'hod.mech@campus.com',
        priority: 5
    }
];

const seedAcademicLeaders = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/campuscare';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Clear existing
        await AcademicLeader.deleteMany({});
        console.log('Cleared existing Academic Leaders');

        // Insert new
        await AcademicLeader.insertMany(leaders);
        console.log('Added Academic Leaders');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedAcademicLeaders();
