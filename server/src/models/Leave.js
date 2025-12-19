import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['Night Out', 'Home Visit', 'Medical'],
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending HOD Approval', 'Approved by HOD', 'Rejected by HOD', 'Approved by Warden', 'Rejected by Warden', 'Approved', 'Rejected'],
        default: 'Pending HOD Approval',
    },
    // Independent Statuses for Parallel Approval
    hodStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    wardenStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    // HOD Action
    hodActionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    hodActionDate: {
        type: Date
    },
    hodRemark: {
        type: String
    },
    // Warden Action
    wardenActionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    wardenActionDate: {
        type: Date
    },
    wardenRemark: {
        type: String
    }
}, { timestamps: true });

const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;
