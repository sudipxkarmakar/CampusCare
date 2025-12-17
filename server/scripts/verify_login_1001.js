
import fetch from 'node-fetch';

const login = async () => {
    try {
        console.log("Attempting Login for 1001...");
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rollNumber: '1001',
                password: 'password123',
                role: 'student'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Login SUCCESS!");
            console.log("Token received:", data.token ? "YES" : "NO");
        } else {
            console.log("❌ Login FAILED");
            console.log("Status:", response.status);
            console.log("Message:", data.message);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
};

login();
