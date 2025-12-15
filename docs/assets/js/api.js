const API_URL = 'http://localhost:5000/api';

const api = {
    post: async (endpoint, data) => {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.warn('Backend unavailable, switching to Demo Mode:', error);

            // --- DEMO MODE FALLBACK ---
            // If the server is down, we allow login with the provided credentials
            // to demonstrate the UI functionality.

            if (endpoint === '/auth/login' || endpoint === '/auth/register') {
                // Simulate a slight delay for realism
                await new Promise(r => setTimeout(r, 800));

                return {
                    token: 'mock-jwt-token-12345',
                    name: 'Sumit Modi', // Default to the user's preferred name
                    role: data.role || 'student',
                    identifier: data.identifier || data.rollNumber || '10800222026',
                    department: data.department || 'CSE',
                    message: 'Login Successful (Demo Mode)'
                };
            }

            return { message: 'Network Error: Backend unreachable (Server Offline). Demo mode active for Login only.' };
        }
    },
    // Add get, put, etc. as needed
};
