export const parseRollNumber = (rollString) => {
    // 1. Check for Legacy Format (CSE-2025-045)
    if (rollString.includes('-')) {
        const parts = rollString.split('-');
        if (parts.length < 3) return null;

        return {
            dept: parts[0].toUpperCase(),
            batch: parts[1],
            section: parseInt(parts[2]) % 2 === 0 ? 'A' : 'B',
            id: parts[2]
        };
    }

    // 2. Check for new 11-Digit Format (e.g. 10900120001)
    if (/^\d{11}$/.test(rollString)) {
        return {
            dept: 'General', // Cannot infer Dept from just digits without schema
            batch: '2025',   // Defaulting to current batch for demo
            section: 'A',
            id: rollString
        };
    }

    return null;
};
