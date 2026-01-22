import axios from 'axios';

export const analyzeComplaint = async (text) => {
    try {
        const response = await axios.post('http://localhost:8000/analyze', {
            text: text
        });
        return response.data;
    } catch (error) {
        console.error('Error connecting to ML Service:', error.message);
        // Fallback or rethrow
        return { category: 'Other', priority: 'Medium' };
    }
};
