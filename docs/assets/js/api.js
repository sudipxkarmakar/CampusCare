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
                    token: 'mock-token-student',
                    role: 'student',
                    name: 'Mock Student',
                    identifier: data.identifier
                };
            }

            if (endpoint === '/auth/register') {
                console.warn('Mock Registration');
                return {
                    token: 'mock-token-new-user',
                    role: data.role || 'student',
                    name: data.name || 'New User',
                    identifier: data.email || data.rollNumber
                };
            }
            return { message: 'Network Error (Server Unreachable). Please check if server is running on port 5000.' };
            return { message: 'Network Error (Server Unreachable)' };
        }
    },
    // Add get, put, etc. as needed
};
