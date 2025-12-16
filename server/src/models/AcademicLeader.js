import mongoose from 'mongoose';

const academicLeaderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true, // e.g., "Principal", "Dean", "HOD"
    },
    qualification: {
        type: String,
        required: true, // e.g., "Ph.D. in Computer Science"
    },
    experience: {
        type: String, // e.g., "25 Years"
    },
    email: {
        type: String,
    },
    department: {
        type: String, // e.g., "CSE" (Optional, mostly for HODs)
    },
    image: {
        type: String, // URL to image
        default: 'https://ui-avatars.com/api/?name=Admin&background=random'
    },
    message: {
        type: String, // Message/Quote from the leader
    },
    priority: {
        type: Number,
        default: 10, // 1 = High Priority (Principal), 10 = Low
    }
}, { timestamps: true });

const AcademicLeader = mongoose.model('AcademicLeader', academicLeaderSchema);
export default AcademicLeader;
