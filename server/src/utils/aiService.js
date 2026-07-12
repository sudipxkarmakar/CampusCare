const includesAny = (text, words) => words.some((word) => text.includes(word));

export const analyzeComplaint = async (text = '') => {
    const lowerText = text.toLowerCase();

    let category = 'Other';
    if (includesAny(lowerText, ['fan', 'light', 'electric', 'power', 'wire', 'shock'])) category = 'Electrical';
    else if (includesAny(lowerText, ['toilet', 'washroom', 'dirty', 'clean', 'garbage', 'smell'])) category = 'Sanitation';
    else if (includesAny(lowerText, ['bench', 'door', 'window', 'wall', 'pipe', 'water leak'])) category = 'Civil';
    else if (includesAny(lowerText, ['wifi', 'internet', 'computer', 'projector', 'network'])) category = 'IT';
    else if (includesAny(lowerText, ['food', 'mess', 'canteen', 'meal'])) category = 'Mess';
    else if (includesAny(lowerText, ['ragging', 'fight', 'harassment', 'theft', 'stolen'])) category = 'Disciplinary';
    else if (includesAny(lowerText, ['personal', 'mentor', 'teacher', 'fever', 'headache', 'sick', 'anxiety', 'depression', 'stressed', 'medical', 'vomit', 'illness', 'doctor', 'ankle', 'injury', 'injured', 'pain', 'hurt', 'wound', 'hospital', 'accident', 'cough', 'bleed', 'bleeding', 'counseling', 'mental', 'unconscious', 'fainted', 'collapsed', 'collapse', 'fell down'])) category = 'Personal';

    let priority = 'Medium';
    if (includesAny(lowerText, ['fire', 'shock', 'injury', 'harassment', 'ragging', 'urgent', 'danger'])) priority = 'Urgent';
    else if (includesAny(lowerText, ['not working', 'broken', 'leak', 'stolen'])) priority = 'High';
    else if (includesAny(lowerText, ['minor', 'request', 'suggestion'])) priority = 'Low';

    return { category, priority };
};

export const sendFeedback = async () => ({
    success: true,
    message: 'Feedback recorded locally.'
});
