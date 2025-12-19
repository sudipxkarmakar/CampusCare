
// using native fetch

const verifyLive = async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDQ1YjQ2ODFkN2FkNGNiNDY0Y2I1OCIsImlhdCI6MTc2NjE2ODQ0NCwiZXhwIjoxNzY4NzYwNDQ0fQ.jnswii1vJ7Ece-ZN_ja3MtGUSQTt5wn6FHKJyXXejMs';

    try {
        const res = await fetch('http://localhost:5000/api/routine/student', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            console.log(`Success! Status: ${res.status}`);
            console.log(`Got ${data.length} items`);
            if (data.length > 0) console.log('Sample:', JSON.stringify(data[0], null, 2));
        } else {
            console.log(`Failed! Status: ${res.status}`);
            const text = await res.text();
            console.log('Body:', text);
        }
    } catch (e) {
        console.error('Fetch error:', e.message);
    }
};

verifyLive();
