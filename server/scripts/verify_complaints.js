
const BASE_URL = 'http://localhost:5000/api';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(url, options = {}) {
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        const data = await res.json();
        if (!res.ok) {
            throw { response: { data }, message: `HTTP ${res.status} ${res.statusText}` };
        }
        return { data, status: res.status };
    } catch (e) {
        throw e;
    }
}

async function runTest() {
    try {
        console.log('--- Starting Complaint System Verification ---');

        const uniqueId = Date.now();
        const hostelerEmail = `hosteler${uniqueId}@test.com`;
        const hostelerRoll = `H${uniqueId}`;
        const wardenEmail = `warden${uniqueId}@test.com`;
        const wardenEmpId = `W${uniqueId}`;

        let hostelerToken = '';
        let wardenToken = '';
        let hostelerId = '';
        let complaintId1 = '';
        let complaintId2 = '';

        // 1. Register Hosteler
        console.log('\n1. Registering Hosteler...');
        try {
            const res = await fetchJson(`${BASE_URL}/auth/register`, {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Test Hosteler',
                    email: hostelerEmail,
                    password: 'password123',
                    role: 'hosteler',
                    department: 'CSE',
                    batch: '2024',
                    rollNumber: hostelerRoll,
                    hostelName: 'H1',
                    roomNumber: '101'
                })
            });
            hostelerToken = res.data.token;
            hostelerId = res.data._id;
            console.log('   Hosteler Registered:', res.data.name);
        } catch (e) {
            console.log('   Hosteler registration failed:', e.message);
            throw e;
        }

        // 2. Register Warden
        console.log('\n2. Registering Warden...');
        try {
            const res = await fetchJson(`${BASE_URL}/auth/register`, {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Test Warden',
                    email: wardenEmail,
                    password: 'password123',
                    role: 'warden',
                    employeeId: wardenEmpId,
                    department: 'Admin'
                })
            });
            wardenToken = res.data.token;
            console.log('   Warden Registered:', res.data.name);
        } catch (e) {
            console.log('   Warden registration failed:', e.message);
            if (e.response) console.log(JSON.stringify(e.response.data));
            throw e;
        }

        // 3. File Facility Complaint
        console.log('\n3. Filing Facility Complaint...');
        const comp1 = await fetchJson(`${BASE_URL}/complaints`, {
            method: 'POST',
            body: JSON.stringify({
                title: 'Broken Fan',
                description: 'Fan in room 101 not working',
                category: 'Electrical',
                priority: 'High'
            }),
            headers: { Authorization: `Bearer ${hostelerToken}` }
        });
        complaintId1 = comp1.data.complaint._id;
        console.log('   Complaint Filed:', comp1.data.complaint.title);

        // 4. File Disciplinary Complaint
        console.log('\n4. Filing Disciplinary Complaint...');
        const comp2 = await fetchJson(`${BASE_URL}/complaints`, {
            method: 'POST',
            body: JSON.stringify({
                title: 'Noise Issue',
                description: 'Student making noise',
                category: 'Disciplinary',
                priority: 'Medium',
                againstUser: hostelerId
            }),
            headers: { Authorization: `Bearer ${hostelerToken}` }
        });
        complaintId2 = comp2.data.complaint._id;
        console.log('   Complaint Filed:', comp2.data.complaint.title);

        // 5. Warden Fetch Complaints
        console.log('\n5. Warden Fetching Complaints...');
        const wComps = await fetchJson(`${BASE_URL}/warden/complaints`, {
            headers: { Authorization: `Bearer ${wardenToken}` }
        });
        console.log(`   Fetched ${wComps.data.length} complaints.`);
        const found1 = wComps.data.find(c => c._id === complaintId1);
        const found2 = wComps.data.find(c => c._id === complaintId2);

        if (found1) console.log('   Verified Facility Complaint visibility.');
        else console.error('   FAILED: Facility Complaint not found.');

        if (found2) console.log('   Verified Disciplinary Complaint visibility.');
        else console.error('   FAILED: Disciplinary Complaint not found.');

        // 6. Warden Resolve Facility Complaint
        console.log('\n6. Warden Resolving Facility Complaint...');
        const res1 = await fetchJson(`${BASE_URL}/warden/complaints/${complaintId1}/resolve`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${wardenToken}` }
        });
        console.log('   Status Updated:', res1.data.status);

        // 7. Warden Escalate Disciplinary Complaint
        console.log('\n7. Warden Escalating Disciplinary Complaint...');
        const res2 = await fetchJson(`${BASE_URL}/warden/complaints/${complaintId2}/escalate`, {
            method: 'PUT',
            body: JSON.stringify({ target: 'Disciplinary Committee' }),
            headers: { Authorization: `Bearer ${wardenToken}` }
        });
        console.log('   Status Updated:', res2.data.status);
        console.log('   Uplifted To:', res2.data.upliftedTo);

        console.log('\n--- Verification Success ---');

    } catch (error) {
        console.error('\n--- Verification Failed ---');
        console.error(error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
        process.exit(1);
    }
}

runTest();
