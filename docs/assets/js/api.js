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
            // MOCK FALLBACK FOR DEMO/OFFLINE MODE
            // If server is down, allow login with any credentials for UI testing
            console.warn('Falling back to Mock Data');
            if (endpoint === '/auth/login') {
                // Mock Logic based on Input
                if (data.identifier && (data.identifier.includes('EMP') || data.identifier.includes('emp'))) {
                    return {
                        token: 'mock-token-teacher',
                        role: 'teacher',
                        name: 'Amit Kumar Jha',
                        identifier: data.identifier
                    };
                }
                if (data.identifier && (data.identifier.startsWith('H-') || data.identifier.startsWith('h-'))) {
                    return {
                        token: 'mock-token-hosteler',
                        role: 'hosteler',
                        name: 'Rahul Verma',
                        identifier: data.identifier
                    };
                }
                // Default Student
                return {
                    token: 'mock-token-123',
                    role: 'student',
                    name: 'Sudip Karmakar',
                    identifier: 'CSE-2025-001'
                };
            }
            return { message: 'Network Error (Server Unreachable)' };
        }
    },
    // Add get, put, etc. as needed
};
