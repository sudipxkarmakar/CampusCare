// Native fetch is available in Node 18+

async function testLandingPageQuery() {
    try {
        console.log("Fetching notices with role=public...");
        const response = await fetch('http://localhost:5000/api/notices?role=public');
        if (!response.ok) {
            console.error("API Error:", response.status, response.statusText);
            return;
        }
        const notices = await response.json();
        console.log(`Found ${notices.length} notices.`);
        notices.forEach(n => {
            console.log(`- [${n.audience}] ${n.title} (ID: ${n._id})`);
        });

    } catch (error) {
        console.error("Fetch failed:", error);
    }
}

testLandingPageQuery();
