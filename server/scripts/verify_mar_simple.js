
const BASE_URL = 'http://localhost:5000/api';

const run = async () => {
    try {
        // 1. Login
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: '1001', password: 'password123', role: 'student' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        console.log("Login OK. Token obtained.");

        // 2. Fetch MAR
        console.log("Fetching MAR/MOOCs...");
        const res = await fetch(`${BASE_URL}/mar-moocs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);

        try {
            const json = JSON.parse(text);
            console.log("✅ JSON Valid. Records:", json.records?.length);
        } catch (e) {
            console.log("❌ JSON Invalid. Raw Text Check:");
            console.log(text.substring(0, 200)); // Print first 200 chars
        }

    } catch (e) {
        console.error(e);
    }
};

run();
