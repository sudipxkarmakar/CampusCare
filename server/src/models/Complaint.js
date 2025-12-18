import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['Electrical', 'Sanitation', 'Civil', 'IT', 'Mess', 'Other', 'Disciplinary'],
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium',
    },
    status: {
        type: String,
        enum: ['Submitted', 'Viewed', 'In Progress', 'Resolved'],
        default: 'Submitted',
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    upvotes: {
        type: Number,
        default: 0,
    },
    image: {
        type: String, // URL if we implement upload
    },
    againstUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // If the complaint is against a specific teacher/staff
    },
    isUplifted: {
        type: Boolean,
        default: false,
    },
    upliftedTo: {
        type: String,
        enum: ['HOD', 'Warden', 'Principal'],
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
