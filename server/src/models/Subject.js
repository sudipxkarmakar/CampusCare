import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String, // e.g., CS101
        required: true,
        unique: true,
    },
    department: {
        type: String, // e.g., CSE
        required: true,
    },
    year: {
        type: String, // e.g., "1st Year", "2nd Year"
        required: true,
    },
    semester: {
        type: Number, // 1 to 8
    },
    credits: {
        type: Number,
        default: 3
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Assigned Faculty (handled here for direct lookup)
    teachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
