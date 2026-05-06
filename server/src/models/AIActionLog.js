import mongoose from 'mongoose';
import { EXECUTION_STATUS, CONFIRMATION_STATUS } from '../constants/aiConstants.js';

const aiActionLogSchema = new mongoose.Schema({
    traceId: {
        type: String,
        required: true,
        index: true
    },
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    role: {
        type: String,
        required: true
    },
    intent: {
        type: String, // e.g. "EMERGENCY", "COMPLAINT", "ASSIGNMENT"
        required: true
    },
    tool: {
        type: String, // The tool called, e.g., "create_assignment"
    },
    inputText: {
        type: String,
    },
    generatedArgs: {
        type: mongoose.Schema.Types.Mixed, // Store dynamic JSON args
    },
    executionStatus: {
        type: String,
        enum: Object.values(EXECUTION_STATUS),
        default: EXECUTION_STATUS.DRAFTED
    },
    confirmationStatus: {
        type: String,
        enum: Object.values(CONFIRMATION_STATUS),
        default: CONFIRMATION_STATUS.PENDING
    },
    errorMessage: {
        type: String
    },
    metrics: {
        modelLatency: Number,    // Time spent waiting for LLM
        workflowLatency: Number, // Time spent executing backend logic
        totalResponseTime: Number,
        modelName: String,
        promptVersion: String
    }
}, { timestamps: true });

aiActionLogSchema.index({ userId: 1, createdAt: -1 });
aiActionLogSchema.index({ executionStatus: 1, createdAt: -1 });

const AIActionLog = mongoose.model('AIActionLog', aiActionLogSchema);
export default AIActionLog;
