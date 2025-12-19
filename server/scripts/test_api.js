


const BASE_URL = 'http://localhost:5000/api';

async function testApi() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: 'studentIT1001@campuscare.com', // Adjust if needed
                password: 'password123', // Adjust if needed
                role: 'student'
            })
        });

        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);

        if (!loginRes.ok) {
            console.error('Login Failed:', loginData);
            return;
        }

        const token = loginData.token;
        console.log('Token acquired.');

        // 2. Fetch Content
        console.log('Fetching Content...');
        const contentRes = await fetch(`${BASE_URL}/content/my-content`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Content Status:', contentRes.status);
        const contentData = await contentRes.json();

        if (!contentRes.ok) {
            console.error('Content Fetch Failed:', contentData);
        } else {
            console.log('Content Fetched Successfully. Keys:', Object.keys(contentData));
            console.log('Assignments count:', contentData.assignments ? contentData.assignments.length : 0);
        }

    } catch (error) {
        console.error('Test Script Error:', error);
    }
}

testApi();
