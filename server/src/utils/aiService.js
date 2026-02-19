import axios from 'axios';

export const analyzeComplaint = async (text) => {
    // 1. Keyword Heuristic (Runs FIRST to override ML and handle Personal/Health issues)
    const lowerText = text.toLowerCase();
    const personalKeywords = [
        'stomach', 'pain', 'sick', 'fever', 'doctor', 'medicine', 'headache', 'hurt', 'lonely', 'depressed',
        'vomit', 'nausea', 'bleeding', 'injury', 'broken', 'fracture', 'fainted', 'unconscious', 'dizzy',
        'hand', 'leg', 'arm', 'foot', 'head', 'chest', 'back', 'body', 'skin', 'eye', 'ear', 'nose', 'throat',
        'tuut', 'tuta', 'dard', 'bimar', 'chot' // Hinglish support
    ];

    // 0. Lost/Stolen Heuristic (Critical for lost items)
    const lostKeywords = ['lost', 'stolen', 'missing', 'theft', "can't find", 'cant find', 'misplaced'];
    if (lostKeywords.some(keyword => lowerText.includes(keyword))) {
        console.log('Keyword Heuristic: Detected Lost/Stolen item. Returning Personal/Urgent.');
        return { category: 'Personal', priority: 'Urgent' };
    }

    if (personalKeywords.some(keyword => lowerText.includes(keyword))) {
        console.log('Keyword Heuristic: Detected Personal/Health issue. Returning Personal.');

        let priority = 'Mid'; // Default for health
        const urgentKeywords = ['bleeding', 'unconscious', 'fainted', 'broken', 'fracture', 'accident', 'emergency'];
        if (urgentKeywords.some(k => lowerText.includes(k))) priority = 'Urgent';
        else if (['pain', 'fever', 'vomit'].some(k => lowerText.includes(k))) priority = 'High';

        return { category: 'Personal', priority };
    }

    try {
        const response = await axios.post('http://127.0.0.1:8000/analyze', {
            text: text
        });
        console.log('AI Service Response:', response.data);

        let { category, priority } = response.data;

        // Validation & Normalization
        const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];

        if (priority) {
            // Ensure Title Case (e.g. "urgent" -> "Urgent")
            priority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
        }

        if (!validPriorities.includes(priority)) {
            console.warn(`Invalid priority '${priority}' received from ML. Defaulting to Medium.`);
            priority = 'Medium';
        }

        return { category, priority };
    } catch (error) {
        console.error('AI SERVICE ERROR:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Make sure the Python ML Service is running on port 8000!');
        }
        console.log('Falling back to default priority: Medium');
        // Fallback
        return { category: 'Other', priority: 'Medium' };
    }
};

export const sendFeedback = async (text, category, priority) => {
    try {
        await axios.post('http://127.0.0.1:8000/feedback', {
            text,
            category,
            priority
        });
        console.log('Feedback sent to ML Service successfully.');
    } catch (error) {
        console.error('Failed to send feedback to ML Service:', error.message);
        // Don't throw, just log. Feedback is non-critical for the main flow.
    }
};
