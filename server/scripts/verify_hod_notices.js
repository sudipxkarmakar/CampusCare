
import fs from 'fs';
const API_URL = 'http://localhost:5000/api';
const LOG_FILE = 'verification_log.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\r\n');
}

async function registerUser(user) {
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        return data;
    } catch (e) {
        if (e.message && e.message.includes('already exists')) {
            const loginRes = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: user.email, password: user.password, role: user.role })
            });
            return await loginRes.json();
        }
        throw e;
    }
}

async function postNotice(token, notice) {
    const res = await fetch(`${API_URL}/notices`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notice)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Post notice failed');
    return data;
}

async function getNotices(token, userId, role, department) {
    const res = await fetch(`${API_URL}/notices?role=${role}&userId=${userId}&department=${department}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return await res.json();
}

async function runTest() {
    fs.writeFileSync(LOG_FILE, "Starting Verification...\n");
    log("Starting checking...");
    const timestamp = Date.now();

    // Test HOD
    const hodUser = {
        name: 'Test HOD',
        email: `hod_${timestamp}@test.com`,
        password: 'password123',
        role: 'hod',
        department: 'CSE',
        employeeId: `HOD_${timestamp}`
    };

    // Test Student (Different Dept)
    const studentUser = {
        name: 'Test Student',
        email: `student_${timestamp}@test.com`,
        password: 'password123',
        role: 'student',
        department: 'ECE',
        rollNumber: `${timestamp}`,
        batch: '2025',
        section: 'A',
        year: '3rd Year'
    };

    try {
        // Register
        log("Registering HOD...");
        const hod = await registerUser(hodUser);
        log("HOD Token Received: " + (hod.token ? 'YES' : 'NO'));

        log("Registering Student...");
        const student = await registerUser(studentUser);
        log("Student Token Received: " + (student.token ? 'YES' : 'NO'));

        // Post Notices
        log("Posting CSE Notice...");
        const deptNotice = await postNotice(hod.token, {
            title: `CSE Dept Notice ${timestamp}`,
            content: "Exclusive for CSE",
            audience: 'general',
            targetDept: 'CSE',
            userId: hod._id,
            role: 'hod'
        });

        log("Posting General Notice...");
        const generalNotice = await postNotice(hod.token, {
            title: `General Notice ${timestamp}`,
            content: "For Everyone",
            audience: 'general',
            userId: hod._id,
            role: 'hod'
        });

        // Verify HOD
        log("Checking HOD View...");
        const hodNotices = await getNotices(hod.token, hod._id, 'hod', 'CSE');
        log(`HOD fetched ${hodNotices.length} notices.`);
        const hasDeptNotice = hodNotices.some(n => n.title === deptNotice.title);
        const hasGenNotice = hodNotices.some(n => n.title === generalNotice.title);

        if (hasDeptNotice && hasGenNotice) {
            log("PASS: HOD sees both notices.");
        } else {
            log(`FAIL: HOD missing notices. Dept:${hasDeptNotice} Gen:${hasGenNotice}`);
        }

        // Verify Student
        log("Checking Student View...");
        const studentNotices = await getNotices(student.token, student._id, 'student', 'ECE');
        const studentSeesDeptNotice = studentNotices.some(n => n.title === deptNotice.title);
        const studentSeesGenNotice = studentNotices.some(n => n.title === generalNotice.title);

        if (!studentSeesDeptNotice && studentSeesGenNotice) {
            log("PASS: Student sees General only.");
        } else {
            log(`FAIL: Student visibility incorrect. Dept:${studentSeesDeptNotice} Gen:${studentSeesGenNotice}`);
            log("Student saw: " + studentNotices.map(n => n.title).join(', '));
        }

    } catch (error) {
        log("TEST ERROR: " + error.message);
        if (error.stack) log(error.stack);
    }
}

runTest();
