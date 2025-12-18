
const loginAndFetch = async () => {
    try {
        // 1. Login
        console.log('Logging in as Roll: 1001...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: '1001',
                password: 'password123'
            })
        });

        if (!loginRes.ok) throw new Error(`Login Failed: ${loginRes.status} ${loginRes.statusText}`);

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login Successful. Token:', token ? 'Yes' : 'No');

        // 2. Fetch MAR/MOOCs
        console.log('Fetching MAR/MOOCs...');
        const res = await fetch('http://localhost:5000/api/mar-moocs', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Raw Response:', text);

        try {
            const json = JSON.parse(text);
            console.log('Data:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Response is not JSON');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
};

loginAndFetch();
