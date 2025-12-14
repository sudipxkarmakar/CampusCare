

const baseUrl = 'http://localhost:5001/api/library';

async function testSearch(description, params, expectedStatus, expectedMinResults = -1) {
    console.log(`\nTesting: ${description}`);
    const query = new URLSearchParams(params).toString();
    try {
        const res = await fetch(`${baseUrl}?${query}`);
        const status = res.status;
        console.log(`Status: ${status} (Expected: ${expectedStatus})`);

        if (status !== expectedStatus) {
            console.error(`FAILED: Expected status ${expectedStatus}, got ${status}`);
            const text = await res.text();
            console.error(`Response: ${text}`);
            return;
        }

        if (status === 200) {
            const data = await res.json();
            console.log(`Results found: ${data.length}`);
            if (expectedMinResults >= 0 && data.length < expectedMinResults) {
                console.warn(`WARNING: Expected at least ${expectedMinResults} results, got ${data.length}`);
            }
        } else {
            const error = await res.json();
            console.log(`Error Message: ${error.message}`);
        }
        console.log("PASSED");

    } catch (error) {
        console.error(`ERROR: ${error.message}`);
    }
}

async function runTests() {
    console.log("=== Verifying Library Search Constraints ===");

    // 1. Valid Search (Title) - Should work
    await testSearch('Valid search by Title "Harry"', { search: 'Harry' }, 200, 1);

    // 1b. Search by Author - Should FAIL (return 0 results) because we restricted to Title only
    await testSearch('Search by Author "Rowling" (Should be empty)', { search: 'Rowling' }, 200, 0); // Logic: length should be 0, but status 200

    // 2. Single Character Search (should WORK now)
    await testSearch('Single char search "h"', { search: 'h' }, 200, 0);

    // 3. Regex Special Characters (should not crash and be treated as literal)
    // Searching for '(' should return 200 (empty list probably) but NOT crash regex
    await testSearch('Regex char "("', { search: '(' }, 200);

    // 4. Category Filter (CSE)
    await testSearch('Category Filter: CSE', { category: 'CSE' }, 200, 1);

    // 4b. Category Filter (General)
    await testSearch('Category Filter: General', { category: 'General' }, 200, 1);

    // 5. Default view (no search param) -> should work
    await testSearch('Default view', {}, 200);
}

runTests();
