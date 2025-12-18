
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function testWardenNotices() {
    console.log('Testing Warden Notice Access...');

    // 1. Login as Warden (simulated or using existing token if possible, but let's just make a mock request structure or login again)
    // We need a valid token. Let's try to login as the warden we created/know exists.
    // If we don't know credentials, we can just try to fetch assuming we have a way.
    // Actually, let's just use the "verify_complaints.js" approach of registering/logging in a warden.

    try {
        // Register/Login Warden
        const wardenEmail = `warden_notice_${Date.now()}@test.com`;
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Warden Notice Tester',
                email: wardenEmail,
                password: 'password123',
                role: 'warden',
                employeeId: `EMP${Date.now()}`,
                department: 'Administration'
            })
        });

        const wardenData = await registerRes.json();
        if (!wardenData.token) {
            console.error('Warden Registration Failed:', wardenData.message);
            // Try login if duplicate (though we used unique email)
            return;
        }

        const token = wardenData.token;
        const userId = wardenData._id; // or from decoded token

        // 2. Fetch Notices as Warden
        console.log('Fetching notices as Warden...');
        const noticeRes = await fetch(`${API_URL}/notices?role=warden&userId=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (noticeRes.ok) {
            const notices = await noticeRes.json();
            console.log(`Success! Fetched ${notices.length} notices.`);
            // console.log(JSON.stringify(notices, null, 2));
        } else {
            console.error('Failed to fetch notices:', await noticeRes.text());
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testWardenNotices();
