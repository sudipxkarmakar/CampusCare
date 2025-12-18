import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    contactNumber: {
        type: String,
        // required: true, // Making it optional for now to avoid breaking existing flow if needed, or strictly required? User asked "Add contact no for all", implies new registers.
    },
    profilePicture: {
        type: String, // URL/Path to image
        default: ''
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'hod', 'admin', 'hosteler', 'alumni', 'librarian', 'principal', 'warden', 'dean'],
        default: 'student',
    },
    // Student Specific
    rollNumber: {
        type: String,
        sparse: true,
    },
    batch: String,

    // ... (Student fields) ...

    // Teacher Specific (Registration)
    designation: { type: String }, // Assistant Professor, Lab Faculty, etc.
    yearsExperience: { type: Number },
    joiningYear: { type: Number },
    specialization: { type: String },
    expertise: [{ type: String }],

    // Teacher System/HOD Updates (Phase 2)
    teachingBatches: [{
        passOutYear: String, // e.g. "2026"
        batch: String // "Batch 1"
    }],
    teachingSubjects: [{ type: String }],
    menteesSubBatches: [{ type: String }], // Exactly 2 as per req
    weeklyLoad: { type: Number },
    availabilitySlots: [{ type: String }], // Time slots

    // Assignment & Other refs
    section: String,
    bloodGroup: String, // New Field

    // Staff Specific
    employeeId: {
        type: String,
        sparse: true,
    },

    // Common for Student/Teacher    // Hosteler & Student Common
    batch: { type: String }, // For Student & Hosteler
    passOutYear: { type: String }, // Requested field

    // Updated by system / HOD (Phase 1 Requirements)
    year: { type: String }, // Derived from passOutYear e.g. "1st Year"
    subBatch: { type: String }, // e.g. "1-1", "1-2"
    subjects: [{ type: String }], // Array of subject codes or names
    assignedTeachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    routineId: { type: String },

    // Hosteler Specific
    hostelName: { type: String },
    roomNumber: { type: String },
    roomNumber: { type: String },

    // Teacher Specific
    designation: { type: String },
    yearsExperience: { type: Number },
    joiningYear: { type: Number },
    specialization: { type: String },

    // Assignment & Other refs
    mar: { type: Number, default: 0 },
    moocs: { type: Number, default: 0 },
    attendance: { type: Number, default: 0 },
    cgpa: { type: Number, default: 0 },

    // Common for Student/Teacher/Hosteler
    department: {
        type: String, // e.g. 'CSE'
    },

    // Relationships (Optional based on requirements)
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // Mentees removed - queried by 'mentor' field on Student
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
