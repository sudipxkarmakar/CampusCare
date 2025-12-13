import mongoose from 'mongoose';

const alumniSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    graduationYear: {
        type: Number,
        required: true,
    },
    degree: {
        type: String,
        required: true, // e.g., B.Tech, M.Tech
    },
    department: {
        type: String, // e.g., CSE
    },
    currentCompany: {
        type: String,
    },
    jobTitle: {
        type: String,
    },
    linkedinProfile: {
        type: String,
    },
    about: {
        type: String,
    }
}, { timestamps: true });

const Alumni = mongoose.model('Alumni', alumniSchema);
export default Alumni;
