export const extractEntities = (parsed) => {
    const text = parsed.normalized;
    const entities = {};

    // 1. Broad Synonym Mapping for Category and Priority
    const synonymMap = [
        { keywords: ['ragging', 'ragged', 'bullying', 'harassment', 'disciplinary'], category: 'Disciplinary', priority: 'Critical' },
        { keywords: ['fire', 'shock', 'sparking', 'burning wire'], category: 'Electrical', priority: 'Critical' },
        { keywords: ['electricity', 'light not working', 'fan stopped', 'fan not working', 'shock', 'electric', 'fan'], category: 'Electrical', priority: 'Medium' },
        { keywords: ['internet', 'wifi', 'network slow', 'wifi issue', 'wifi not working'], category: 'IT', priority: 'Medium' },
        { keywords: ['food', 'mess', 'canteen', 'food poisoned'], category: 'Mess', priority: 'Medium' },
        { keywords: ['dirty washroom', 'toilet', 'sanitation', 'cleanliness'], category: 'Sanitation', priority: 'Medium' },
        { keywords: ['water leak', 'water leakage', 'leakage', 'pipe broken', 'civil'], category: 'Civil', priority: 'High' },
        { keywords: ['broken chair', 'broken bench'], category: 'Civil', priority: 'Low' },
        { keywords: ['medical emergency', 'accident', 'bleeding', 'fracture'], category: 'Personal', priority: 'Critical' }
    ];

    for (const mapping of synonymMap) {
        if (mapping.keywords.some(kw => text.includes(kw))) {
            entities.category = mapping.category;
            entities.priority = mapping.priority;
            break;
        }
    }

    // Direct match Category fallback if no synonyms matched
    if (!entities.category) {
        const categoryMatch = text.match(/\b(electrical|sanitation|civil|it|mess|disciplinary|personal)\b/i);
        if (categoryMatch) {
            const val = categoryMatch[1].toLowerCase();
            entities.category = val === 'it' ? 'IT' : val.charAt(0).toUpperCase() + val.slice(1);
        }
    }

    // Direct match Priority fallback
    if (!entities.priority) {
        const priorityMatch = text.match(/\b(low|medium|high|urgent)\b/i);
        if (priorityMatch) entities.priority = priorityMatch[1];
    }

    // Subject/Keywords mapping
    const subjectMatch = text.match(/(?:subject|course)\s+([a-z0-9\s_-]+)/i);
    if (subjectMatch) {
        entities.subject = subjectMatch[1].trim();
    }

    // Leave Types
    if (text.includes('night out')) entities.leaveType = 'Night Out';
    else if (text.includes('medical')) entities.leaveType = 'Medical';
    else if (text.includes('home visit')) entities.leaveType = 'Home Visit';

    return entities;
};
