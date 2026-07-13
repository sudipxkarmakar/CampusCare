const COMPLAINT_RULES = [
    { category: 'Disciplinary', subcategory: 'Ragging', priority: 'Critical', department: 'Disciplinary Committee', confidence: 0.98, keywords: ['ragging', 'ragged', 'forced me', 'threatened', 'senior students'] },
    { category: 'Disciplinary', subcategory: 'Harassment', priority: 'Critical', department: 'Disciplinary Committee', confidence: 0.96, keywords: ['harassment', 'harassing', 'mentally harassing', 'bullying', 'insulting', 'threat'] },
    { category: 'Electrical', subcategory: 'Fan Issue', priority: 'Medium', department: 'Maintenance Department', confidence: 0.95, keywords: ['fan'] },
    { category: 'Electrical', subcategory: 'Lighting Issue', priority: 'Medium', department: 'Maintenance Department', confidence: 0.95, keywords: ['light', 'bulb', 'tube light'] },
    { category: 'Electrical', subcategory: 'Electrical Safety Issue', priority: 'Critical', department: 'Maintenance Department', confidence: 0.97, keywords: ['shock', 'sparking', 'fire', 'burning wire'] },
    { category: 'IT', subcategory: 'WiFi Connectivity Issue', priority: 'Medium', department: 'IT Support', confidence: 0.97, keywords: ['wifi', 'wi-fi', 'internet', 'network'] },
    { category: 'IT', subcategory: 'LAN Connectivity Issue', priority: 'Medium', department: 'IT Support', confidence: 0.95, keywords: ['lan'] },
    { category: 'Sanitation', subcategory: 'Washroom Sanitation Issue', priority: 'Medium', department: 'Housekeeping Department', confidence: 0.96, keywords: ['washroom', 'toilet', 'dirty', 'cleanliness', 'garbage'] },
    { category: 'Mess', subcategory: 'Food Quality Issue', priority: 'High', department: 'Mess Committee', confidence: 0.96, keywords: ['food', 'mess', 'canteen', 'meal', 'breakfast', 'lunch', 'dinner', 'smelled bad', 'smells bad', 'bad smell', 'became sick', 'fell sick', 'food poisoning'] },
    { category: 'Civil', subcategory: 'Structural Safety Issue', priority: 'High', department: 'Maintenance Department', confidence: 0.97, keywords: ['crack', 'staircase', 'wall crack', 'ceiling crack', 'dangerous', 'unsafe', 'structural'] },
    { category: 'Civil', subcategory: 'Water Leakage', priority: 'High', department: 'Maintenance Department', confidence: 0.96, keywords: ['water leakage', 'water leak', 'leakage', 'pipe broken'] },
    { category: 'Civil', subcategory: 'Furniture Damage', priority: 'Low', department: 'Maintenance Department', confidence: 0.94, keywords: ['broken chair', 'chair broken', 'broken bench', 'bench broken'] }
];

const DEFAULTS = {
    complaint: { category: 'Other', subcategory: 'General Complaint', priority: 'Medium', department: 'Campus Administration', confidence: 0.55 }
};

const includesAny = (text, keywords) => keywords.some(keyword => text.includes(keyword));

class Classifier {
    classify(entity, text) {
        const lower = String(text || '').toLowerCase();
        const rules = entity === 'complaint' ? COMPLAINT_RULES : [];
        const match = rules.find(rule => includesAny(lower, rule.keywords));
        return match ? { ...match } : { ...(DEFAULTS[entity] || DEFAULTS.complaint) };
    }
}

export default new Classifier();
