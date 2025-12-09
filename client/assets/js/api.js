const API_URL = 'http://localhost:5000/api';

const api = {
    post: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { message: 'Network Error' };
        }
    },
    // Add get, put, etc. as needed
};
