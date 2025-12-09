export const parseRollNumber = (rollString) => {
    // Format: CSE-2025-045 or CSE-2025-A-045? The prompt example is "CSE-2025-045"
    // And logic says "Section: A/B (Based on internal logic)". 
    // Maybe internal logic matches index or even/odd?
    // Let's assume a simpler format or a split.

    // Example: CSE-2025-045
    // Dept: CSE
    // Batch: 2025
    // ID: 045
    // Section? "Based on internal logic". Let's assume ID % 2 === 0 ? 'A' : 'B' for now, or just default.

    if (!rollString.includes('-')) return null;

    const parts = rollString.split('-');
    if (parts.length < 3) return null;

    const dept = parts[0].toUpperCase();
    const batch = parts[1];
    const id = parts[2];

    // Simple logic for section demo
    const section = parseInt(id) % 2 === 0 ? 'A' : 'B';

    return {
        dept,
        batch,
        section,
        id
    };
};
