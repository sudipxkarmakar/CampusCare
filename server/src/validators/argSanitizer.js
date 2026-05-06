export const sanitizeArgs = (actionName, args) => {
    if (!args || typeof args !== 'object') return {};
    
    // Basic trimming and string sanitization
    const sanitizeValue = (val) => {
        if (typeof val === 'string') {
            // Strip control chars & limit length to 1000 characters
            return val.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().substring(0, 1000);
        }
        return val;
    };

    const safeArgs = {};
    for (const [key, val] of Object.entries(args)) {
        safeArgs[key] = sanitizeValue(val);
    }
    
    // Action-specific validations/coercions
    if (actionName === 'submit_leave') {
        const VALID_LEAVES = ['Night Out', 'Home Visit', 'Medical'];
        if (!VALID_LEAVES.includes(safeArgs.leaveType)) {
            safeArgs.leaveType = 'Home Visit'; // Default fallback
        }
    }
    
    // Add additional action-specific sanitization here as they arise (e.g. date parsing, enums)
    return safeArgs;
}
