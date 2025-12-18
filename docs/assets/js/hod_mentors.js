const API_URL = 'http://localhost:5000/api/hod';

// State
let allTeachers = [];
let currentStudentId = null;
let currentBatchKey = null; // New state for bulk assign

document.addEventListener('DOMContentLoaded', async () => {
    // alert("Debug: Script Loaded v2"); // Commenting out to avoid annoyance, relying on v2 param
    checkAuth();

    // Determine default year or wait
    const yearSelect = document.getElementById('mentorYearFilter');
    if (yearSelect) {
        // Default to 4th year as per common request
        yearSelect.value = "4th Year";
        await loadTeachers(); // Pre-fetch teachers
        loadStudentsForMentorship();
    }
});

async function loadTeachers() {
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/teachers`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        allTeachers = await res.json();
    } catch (err) {
        console.error("Failed to load teachers", err);
    }
}

const yearMapping = {
    "4th Year": "2026",
    "3rd Year": "2027",
    "2nd Year": "2028",
    "1st Year": "2029"
};

async function loadStudentsForMentorship() {
    const yearLabel = document.getElementById('mentorYearFilter').value; // "4th Year"
    const targetYear = yearMapping[yearLabel]; // "2026"

    const containers = {
        '1-1': document.getElementById('batch11List'),
        '1-2': document.getElementById('batch12List'),
        '2-1': document.getElementById('batch21List'),
        '2-2': document.getElementById('batch22List')
    };

    // Key mapping for rendering
    const containerMap = {
        'Batch 11': 'batch11List',
        'Batch 12': 'batch12List',
        'Batch 21': 'batch21List',
        'Batch 22': 'batch22List'
    };

    // Show loading
    Object.values(containers).forEach(c => {
        if (c) c.innerHTML = '<div class="loading-spinner"></div>';
    });

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const res = await fetch(`${API_URL}/students?_t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const allStudents = await res.json();
        // const sampleStudent = allStudents.find(s => s.mentorName) || allStudents[0];
        // console.error("DEBUG SAMPLE STUDENT:", JSON.stringify(sampleStudent, null, 2));

        // Filter by Year (Check year label)
        // Data has "4th Year" etc.
        const yearFiltered = allStudents.filter(s =>
            s.year === yearLabel
        );

        // Clear containers
        Object.values(containers).forEach(c => {
            if (c) c.innerHTML = '';
        });

        // Even if no students, we want to show the headers potentially? 
        // No, let's keep logic simple. If empty, just show empty message in all.
        if (yearFiltered.length === 0) {
            Object.values(containerMap).forEach(id => {
                const c = document.getElementById(id);
                // Try to infer batch key from ID if possible or just show message
                // Actually to show "Assign Batch" button even when empty is a good feature
                // But for now let's stick to standard flow.
                if (c) c.innerHTML = `<div style="color:#94a3b8; font-style:italic; padding:10px;">No students found for ${yearLabel}</div>`;
            });
            // return; // Don't return, we might want to allow assigning even if empty list? 
            // Actually assignBatchMentor updates students IN DB. If no students in DB, it updates 0.
            // So rendering button when empty is valid but useless visually if no list appears.
            // Let's return.
            return;
        }

        const distributed = {
            'Batch 11': [], 'Batch 12': [], 'Batch 21': [], 'Batch 22': []
        };

        yearFiltered.forEach(s => {
            let sb = s.subBatch || '';
            let key = null;

            // Normalize: "Batch 11" -> "Batch 11"
            if (sb.includes('11') || sb === '1-1') key = 'Batch 11';
            else if (sb.includes('12') || sb === '1-2') key = 'Batch 12';
            else if (sb.includes('21') || sb === '2-1') key = 'Batch 21';
            else if (sb.includes('22') || sb === '2-2') key = 'Batch 22';
            else if (sb === 'Batch 11' || sb === 'Batch 12' || sb === 'Batch 21' || sb === 'Batch 22') key = sb;

            if (key && distributed[key]) {
                distributed[key].push(s);
            }
        });

        // Use keys to render
        for (const [key, list] of Object.entries(distributed)) {
            const containerId = containerMap[key];
            const container = document.getElementById(containerId);
            if (container) {
                renderStudentList(container, list, key);
            }
        }

    } catch (err) {
        console.error(err);
        Object.values(containerMap).forEach(id => {
            const c = document.getElementById(id);
            if (c) c.innerHTML = 'Error loading students';
        });
    }
}

function renderStudentList(container, students, batchKey) {
    let html = '';

    // Header with Bulk Assign Button
    html += `
    <div style="margin-bottom:10px; display:flex; justify-content:center;">
        <button onclick="openBatchAssignModal('${batchKey}')" 
            style="background:#3b82f6; color:white; border:none; padding:5px 10px; border-radius:6px; font-size:0.8rem; cursor:pointer;">
            <i class="fa-solid fa-users-gear"></i> Assign Mentor to Batch
        </button>
    </div>
    `;

    if (students.length === 0) {
        html += '<div style="color:#94a3b8; font-style:italic; text-align:center;">No students found</div>';
        container.innerHTML = html;
        return;
    }

    html += students.map(s => {
        const mentorName = s.mentorName || 'Not Assigned';
        const isAssigned = s.mentorName ? true : false;

        return `
        <div style="background:white; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:600; font-size:0.9rem; color:#334155;">${s.name}</div>
                <div style="font-size:0.8rem; color:#64748b;">${s.rollNumber}</div>
                <div style="font-size:0.75rem; color:${isAssigned ? '#166534' : '#ef4444'}; margin-top:2px;">
                    <i class="fa-solid fa-user-tie"></i> ${mentorName}
                </div>
            </div>
            <button onclick="openAssignModal('${s._id}', '${s.name}')" 
                style="background:#eff6ff; color:#3b82f6; border:none; width:32px; height:32px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;"
                title="Assign Mentor">
                <i class="fa-solid fa-chalkboard-user"></i>
            </button>
        </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function openAssignModal(studentId, studentName) {
    currentStudentId = studentId;
    currentBatchKey = null; // Clear batch context
    document.getElementById('assignModalTitle').innerText = `Assign Mentor to ${studentName}`;
    document.getElementById('assignMentorModal').style.display = 'block';
    renderTeacherList();
}

function openBatchAssignModal(batchKey) {
    currentBatchKey = batchKey;
    currentStudentId = null; // Clear student context
    document.getElementById('assignModalTitle').innerText = `Assign Mentor to ${batchKey}`;
    document.getElementById('assignMentorModal').style.display = 'block';
    renderTeacherList();
}

function renderTeacherList(search = '') {
    const listDiv = document.getElementById('teacherList');
    const filtered = allTeachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    listDiv.innerHTML = filtered.map(t => `
        <div onclick="assignMentor('${t._id}')" 
             style="padding:10px; border-bottom:1px solid #f1f5f9; cursor:pointer; hover:background:#f8fafc; display:flex; justify-content:space-between;">
             <div>
                <div style="font-weight:500;">${t.name}</div>
                <div style="font-size:0.8rem; color:#64748b;">${t.designation || 'Faculty'}</div>
             </div>
             <i class="fa-solid fa-chevron-right" style="color:#cbd5e1;"></i>
        </div>
    `).join('');

    const searchInput = document.getElementById('teacherSearch');
    if (!searchInput.dataset.listening) {
        searchInput.addEventListener('input', (e) => renderTeacherList(e.target.value));
        searchInput.dataset.listening = true;
    }
}

async function assignMentor(teacherId) {
    if (!currentStudentId && !currentBatchKey) return;

    try {
        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr);

        let url = '';
        let body = {};

        if (currentBatchKey) {
            // Batch Assignment
            url = `${API_URL}/batches/assign-mentor`;
            const yearLabel = document.getElementById('mentorYearFilter').value;
            body = {
                teacherId,
                year: yearLabel,
                subBatch: currentBatchKey
            };
        } else {
            // Single Assignment
            url = `${API_URL}/students/assign-mentor`;
            body = { studentId: currentStudentId, teacherId };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert(currentBatchKey ? 'Batch Mentor Assigned Successfully' : 'Mentor Assigned Successfully');
            document.getElementById('assignMentorModal').style.display = 'none';
            loadStudentsForMentorship(); // Reload to update UI
        } else {
            const err = await res.json();
            alert('Error: ' + err.message);
        }

    } catch (err) {
        console.error(err);
        alert('Failed to assign mentor');
    }
}

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'hod' && user.role !== 'admin') {
        alert('Unauthorized Access');
        window.location.href = '../index.html';
        return;
    }

    const userNameEl = document.getElementById('userName');
    const userProfileEl = document.getElementById('userProfile');
    const userDetailsEl = document.getElementById('userDetails');

    if (userNameEl) userNameEl.innerText = `Hello, ${user.name}`;
    if (userProfileEl) userProfileEl.style.display = 'flex';
    if (userDetailsEl) {
        userDetailsEl.innerHTML = `<strong>${user.role.toUpperCase()}</strong><br>${user.email}<br>Dept: ${user.department || 'N/A'}`;
    }

    window.toggleProfileMenu = function () {
        const menu = document.getElementById('profileMenu');
        if (menu) menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    }
    window.logout = function () {
        localStorage.removeItem('user');
        window.location.href = '../login.html';
    }
}
