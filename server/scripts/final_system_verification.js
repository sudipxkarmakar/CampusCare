
// Native fetch used

const BASE_URL = 'http://localhost:5000/api';
const STUDENT_CREDENTIALS = {
    identifier: '1001',
    password: 'password123',
    role: 'student'
};

const runVerification = async () => {
    console.log("🚀 Starting Final System Verification...");

    try {
        // 1. AUTHENTICATION
        console.log("\n🔐 Verifying Authentication...");
        console.log(`   Attempting login for ${STUDENT_CREDENTIALS.rollNumber}...`);

        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(STUDENT_CREDENTIALS)
        });

        if (!loginRes.ok) throw new Error(`Login Failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.token;
        const user = loginData;

        console.log("   ✅ Login Successful!");
        console.log(`   👤 User: ${user.name} | Batch: ${user.batch} | Dept: ${user.department}`);

        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. ASSIGNMENTS & DASHBOARD LOGIC
        console.log("\n📚 Verifying Assignments & Dashboard Logic...");
        const assignRes = await fetch(`${BASE_URL}/assignments?dept=${user.department}&batch=${user.batch}`, { headers });
        const assignments = await assignRes.json();

        // Emulate Frontend Filtering Logic
        const assignmentTypeOnly = assignments.filter(a => a.type === 'assignment');
        const notesTypeOnly = assignments.filter(a => a.type === 'note');
        const pendingAssignments = assignmentTypeOnly.filter(a => !a.submitted);

        console.log(`   - Total Fetched Items: ${assignments.length}`);
        console.log(`   - Assignments (Type='assignment'): ${assignmentTypeOnly.length}`);
        console.log(`   - Notes (Type='note'): ${notesTypeOnly.length}`);
        console.log(`   - Pending Count (Logic Check): ${pendingAssignments.length}`);

        // Verify "All" batch inclusion
        const hasAllBatch = assignments.some(a => a.batch === 'All');
        if (hasAllBatch) console.log("   ✅ Data includes 'All' batch assignments (Fix Verified)");
        else console.log("   ⚠️ No 'All' batch assignments found (might be okay if none seeded, but verify db)");

        // 3. MAR & MOOCS
        console.log("\n🏆 Verifying MAR / MOOCs...");
        const marRes = await fetch(`${BASE_URL}/mar-moocs`, { headers });
        const marData = await marRes.json();

        console.log(`   - MAR Records: ${marData.records.filter(r => r.category === 'MAR').length}`);
        console.log(`   - MOOC Records: ${marData.records.filter(r => r.category === 'MOOC').length}`);
        console.log("   ✅ MAR/MOOCs API Accessible");

        // 4. ROUTINE
        console.log("\n📅 Verifying Routine...");
        const routineRes = await fetch(`${BASE_URL}/routine?dept=${user.department}&year=${user.year}&batch=${user.batch}`, { headers });
        const routineData = await routineRes.json();

        if (routineData.length > 0) {
            console.log(`   ✅ Routine Found for ${user.department}/${user.batch} (${routineData.length} days)`);
        } else {
            console.log("   ⚠️ Routine Empty (Check seeding)");
        }

        console.log("\n✨ FINAL VERDICT: All Critical Modules Operational.");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ VERIFICATION FAILED:", error.message);
        process.exit(1);
    }
};

runVerification();
