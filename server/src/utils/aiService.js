import axios from 'axios';

export const analyzeComplaint = async (text) => {
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

        return { category, priority };
    } catch (error) {
        console.error('AI SERVICE ERROR:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Make sure the Python ML Service is running on port 8000!');
        }
        // Fallback only if the entire service is down
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
