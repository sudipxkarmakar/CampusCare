const testOldEndpoint = async () => {
    try {
        console.log('📡 Testing OLD Endpoint http://localhost:5000/api/notices/public ...');

        const response = await fetch('http://localhost:5000/api/notices/public');

        console.log(`Response Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('✅ Success! Data received (OLD SERVER CONFIRMED):', data);
            } else {
                console.log('❌ Received non-JSON response (New Server might be running, or 404 fallback).');
            }
        } else {
            console.log('❌ Server returned an error.');
        }

    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
};

testOldEndpoint();
