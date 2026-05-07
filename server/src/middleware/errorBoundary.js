import { AIProviderError, ValidationError, OCCConflictError, WorkflowExecutionError } from '../utils/errors.js';
import { EXECUTION_STATUS } from '../constants/aiConstants.js';

export const globalErrorBoundary = (err, req, res, next) => {
    // Inject correlation ID if available
    const requestId = req.requestId || 'UNKNOWN';
    
    // Log the raw error internally, preserving stack trace only outside of production
    if (process.env.NODE_ENV === 'production') {
        console.error(`[${new Date().toISOString()}] [${requestId}] Error: ${err.message}`);
    } else {
        console.error(`[${new Date().toISOString()}] [${requestId}] Error:`, err);
    }

    // Default generic error
    let statusCode = 500;
    let userMessage = "Service temporarily unavailable. Please try again later.";

    // Classify known errors
    if (err instanceof OCCConflictError || err.message?.includes('OCCConflictError') || err.message?.includes('Action already completed')) {
        statusCode = 409;
        userMessage = "Action already processed or superseded.";
    } else if (err instanceof ValidationError || err.name === 'ValidationError') {
        statusCode = 400;
        userMessage = "Invalid request format or missing parameters.";
    } else if (err instanceof AIProviderError) {
        statusCode = 503;
        userMessage = "AI service temporarily unavailable. Please try again.";
    } else if (err instanceof WorkflowExecutionError || err.message?.includes(EXECUTION_STATUS.EXECUTION_TIMEOUT)) {
        statusCode = 408;
        userMessage = "Request timed out. Please retry.";
    } else if (err.type === 'entity.too.large') {
        statusCode = 413;
        userMessage = "Request body exceeds maximum size limit.";
    }

    // Format safe response
    res.status(statusCode).json({
        success: false,
        message: userMessage,
        requestId
    });
};
