const API_URL = 'http://localhost:5000/api';

const api = {
    // Generic Fetch with Auth (GET)
    fetchWithAuth: async (endpoint) => {
        // Fix: Token is likely inside the 'user' object
        const userStr = localStorage.getItem('user');
        let token = localStorage.getItem('token'); // Fallback

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.token) token = user.token;
            } catch (e) {
                console.error("Error parsing user from localStorage", e);
            }
        }

        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: headers
        });
    },

    post: async (endpoint, data) => {
        try {
            // Fix: Token retrieval
            const userStr = localStorage.getItem('user');
            let token = localStorage.getItem('token');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.token) token = user.token;
                } catch (e) { }
            }

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
            if (endpoint === '/auth/login' || endpoint === '/auth/register') {
                // Simulate a slight delay for realism
                await new Promise(r => setTimeout(r, 800));

                return {
                    token: 'mock-jwt-token-12345',
                    name: 'Sumit Modi',
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
