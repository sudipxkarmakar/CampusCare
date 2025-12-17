
import { Blob } from 'buffer';

const run = async () => {
    try {
        const uniqueId = `TEST_${Date.now()}`;
        const formData = new FormData();

        formData.append('name', 'Test User');
        formData.append('email', `${uniqueId}@test.com`);
        formData.append('contactNumber', '9999999999');
        formData.append('password', 'password123');
        formData.append('role', 'student');
        formData.append('rollNumber', uniqueId);
        formData.append('department', 'CSE');
        formData.append('year', '1st Year');
        formData.append('batch', '2025');
        formData.append('section', 'A');
        formData.append('bloodGroup', 'O+');

        // Create a fake image blob
        const imageContent = Buffer.from('fakeimagecontent', 'utf-8');
        const blob = new Blob([imageContent], { type: 'image/jpeg' });
        formData.append('profileImage', blob, 'testparams.jpg');

        console.log(`Registering user: ${uniqueId}`);

        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            body: formData
        });

        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log('Response:', data);

        if (res.status === 201 && data.token) {
            console.log('✅ Registration Successful');
            // We can't easily check the DB path here without connecting DB, 
            // but success implies no crash.
        } else {
            console.error('❌ Registration Failed');
        }

    } catch (e) {
        console.error(e);
    }
};

run();
