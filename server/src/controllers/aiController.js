import aiService from '../services/aiService.js';
import AIActionLog from '../models/AIActionLog.js';
import crypto from 'crypto';
import { EXECUTION_STATUS } from '../constants/aiConstants.js';

const getPresentationState = (executionStatus, errorMessage) => {
    switch (executionStatus) {
        case EXECUTION_STATUS.PENDING_CONFIRMATION: return "AWAITING_CONFIRMATION";
        case EXECUTION_STATUS.EXECUTING: return "EXECUTING";
        case EXECUTION_STATUS.EXPIRED: return "EXPIRED";
        case EXECUTION_STATUS.CANCELLED: return "CANCELLED";
        case EXECUTION_STATUS.COMPLETED: return "IDLE";
        case EXECUTION_STATUS.EXECUTION_TIMEOUT: return "TIMEOUT";
        case EXECUTION_STATUS.FAILED:
            if (errorMessage?.includes("OCCConflictError") || errorMessage?.includes("Action already completed")) return "CONFLICT";
            if (errorMessage?.includes("lock_failure")) return "BUSY";
            return "FAILED";
        default: return "IDLE";
    }
};

const getUserMessage = (presentationState) => {
    switch (presentationState) {
        case "AWAITING_CONFIRMATION": return "Please confirm the pending action.";
        case "EXECUTING": return "Processing your request securely...";
        case "EXPIRED": return "The confirmation request has expired.";
        case "CANCELLED": return "The action was successfully cancelled.";
        case "IDLE": return "Ready.";
        case "TIMEOUT": return "The request took too long and was safely aborted.";
        case "CONFLICT": return "This action has already been completed.";
        case "BUSY": return "Another request is currently active. Please wait.";
        case "FAILED": return "An internal error occurred while processing.";
        case "RECOVERING": return "Service temporarily recovering. Please retry shortly.";
        default: return "";
    }
};

export const handleGetStatus = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const latestLog = await AIActionLog.findOne({ conversationId }).sort({ createdAt: -1 });
        
        if (!latestLog) {
            return res.status(404).json({ error: "No active workflow found for this conversation" });
        }

        // Graceful Redis Failure handling
        let executionStatus = latestLog.executionStatus;
        let errorMessage = latestLog.errorMessage;
        let presentationState = getPresentationState(executionStatus, errorMessage);
        
        if (errorMessage?.includes("redis") || errorMessage?.includes("Redis")) {
            presentationState = "RECOVERING";
        }
        
        const responseData = {
            conversationId,
            version: 1, 
            updatedAt: latestLog.updatedAt,
            status: executionStatus,
            presentationState,
            message: getUserMessage(presentationState),
            canConfirm: executionStatus === EXECUTION_STATUS.PENDING_CONFIRMATION,
            execId: latestLog.executionId || null,
            action: latestLog.tool
        };

        const etag = crypto.createHash('md5').update(JSON.stringify(responseData)).digest('hex');
        
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }

        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('ETag', etag);
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Status check error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const handleChat = async (req, res, next) => {
    try {
        const requestId = req.requestId || 'UNKNOWN';
        const { text, history, conversationId } = req.body;
        const user = req.user;

        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${requestId}] AI Chat Request Body:`, { text, conversationId, historyLength: history?.length });
        } else {
            console.log(`[${requestId}] AI Chat Request: conversationId=${conversationId}, textLength=${text?.length}`);
        }

        if (!text) {
            console.warn(`[${requestId}] AI Chat: No text provided`);
            return res.status(400).json({ error: "Text input is required" });
        }
        
        if (text.length > 5000) {
            console.warn(`[${requestId}] AI Chat: Input exceeds 5000 characters.`);
            return res.status(400).json({ error: "Input text exceeds maximum length of 5000 characters." });
        }

        const result = await aiService.processInput(text, user, history, conversationId);
        
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${requestId}] AI Chat Result:`, JSON.stringify(result, null, 2));
        } else {
            console.log(`[${requestId}] AI Chat Result: success=${result.success}, action=${result.action}`);
        }
        
        // Return exactly what the frontend expects
        res.status(200).json({ response: result });

    } catch (error) {
        next(error); // Pass to Global Error Boundary
    }
};

export const handleGenerateComplaint = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        const draft = await aiService.generateComplaintDraft(prompt, req.user);
        res.status(200).json(draft);
    } catch (error) {
        console.error("Generate Complaint Error:", error);
        res.status(500).json({ error: "Failed to generate complaint", details: error.message });
    }
};
