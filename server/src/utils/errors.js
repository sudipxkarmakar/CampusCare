export class AIProviderError extends Error {
    constructor(message, provider, originalError = null) {
        super(message);
        this.name = 'AIProviderError';
        this.provider = provider;
        this.originalError = originalError;
    }
}

export class ValidationError extends Error {
    constructor(message, payload = null, repairAttempted = false) {
        super(message);
        this.name = 'ValidationError';
        this.payload = payload;
        this.repairAttempted = repairAttempted;
    }
}

export class AuthorizationError extends Error {
    constructor(message, userRole = null, requiredRole = null) {
        super(message);
        this.name = 'AuthorizationError';
        this.userRole = userRole;
        this.requiredRole = requiredRole;
    }
}

export class WorkflowExecutionError extends Error {
    constructor(message, currentState, attemptedState, traceId) {
        super(message);
        this.name = 'WorkflowExecutionError';
        this.currentState = currentState;
        this.attemptedState = attemptedState;
        this.traceId = traceId;
        this.isOperational = true;
    }
}

export class OCCConflictError extends WorkflowExecutionError {
    constructor(message, currentState, attemptedState, traceId) {
        super(message, currentState, attemptedState, traceId);
        this.name = 'OCCConflictError';
        this.retryable = false; // Fail fast flag
    }
}
