import crypto from 'crypto';

export const requestCorrelation = (req, res, next) => {
    let requestId = req.headers['x-client-request-id'];
    
    // Strict UUID validation to prevent injection/abuse
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    
    if (!requestId || !UUID_REGEX.test(requestId)) {
        requestId = crypto.randomUUID();
    }
    
    req.requestId = requestId;
    
    // Expose request ID in response headers for client debugging
    res.setHeader('x-request-id', requestId);
    
    next();
};
