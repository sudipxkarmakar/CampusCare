var API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api/hod';

// State
let allTeachers = [];
let currentStudentId = null;
let currentBatchKey = null; // New state for bulk assign

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();

    // Determine default year or wait
    const yearSelect = document.getElementById('mentorYearFilter');
    if (yearSelect) {
        // Default to 4th year as per common request
        yearSelect.value = "4th Year";
        await loadTeachers(); // Pre-fetch teachers
        loadStudentsForMentorship();
        yearSelect.addEventListener('change', loadStudentsForMentorship);
    }
});

// --- CENTRALIZED EVENT DELEGATION ---
document.addEventListener("click", (e) => {
    // 1. Assign Mentor to Batch button
    const batchBtn = e.target.closest(".open-batch-assign-btn");
    if (batchBtn) {
        e.preventDefault();
        e.stopPropagation();
        const batchKey = batchBtn.dataset.batch;
        openBatchAssignModal(batchKey);
        return;
    }

    // 2. Individual student assign button
    const studentBtn = e.target.closest(".open-student-assign-btn");
    if (studentBtn) {
        e.preventDefault();
        e.stopPropagation();
        const studentId = studentBtn.dataset.id;
        const studentName = studentBtn.dataset.name;
        openAssignModal(studentId, studentName);
        return;
    }

    // 3. Select Mentor in search list
    const mentorBtn = e.target.closest(".select-mentor-btn");
    if (mentorBtn) {
        e.preventDefault();
        e.stopPropagation();
        const teacherId = mentorBtn.dataset.id;
        assignMentor(teacherId);
        return;
    }

    // 4. Close modal button (Handles close button)
    const closeBtn = e.target.closest(".close-modal-btn");
    if (closeBtn) {
        e.preventDefault();
        const modal = document.getElementById('assignMentorModal');
        if (modal) modal.style.display = 'none';
        return;
    }

    // 5. Close Modal when clicking outside (backdrop)
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = "none";
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
    <div style="margin-bottom:12px; display:flex; justify-content:center;">
        <button class="open-batch-assign-btn" data-batch="${batchKey}" 
            style="background: var(--primary); color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s;"
            onmouseenter="this.style.background='#5530a6';"
            onmouseleave="this.style.background='var(--primary)';">
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
        <div style="background:white; padding:12px; margin-bottom:10px; border-radius:12px; border:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; transition: transform 0.2s, box-shadow 0.2s;" onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-sm)';" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            <div>
                <div style="font-weight:600; font-size:0.9rem; color:var(--text-dark);">${s.name}</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">${s.rollNumber}</div>
                <div style="font-size:0.75rem; color:${isAssigned ? 'var(--success)' : 'var(--danger)'}; font-weight: 600; margin-top:4px; display: flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-user-tie"></i> ${mentorName}
                </div>
            </div>
            <button class="open-student-assign-btn" data-id="${s._id}" data-name="${s.name}" 
                style="background: var(--primary-light); color: var(--primary); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                onmouseenter="this.style.background='var(--primary)'; this.style.color='white';"
                onmouseleave="this.style.background='var(--primary-light)'; this.style.color='var(--primary)';"
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
    document.getElementById('assignMentorModal').style.display = 'flex';
    renderTeacherList();
}

// Open batch modal
function openBatchAssignModal(batchKey) {
    currentBatchKey = batchKey;
    currentStudentId = null; // Clear student context
    document.getElementById('assignModalTitle').innerText = `Assign Mentor to ${batchKey}`;
    document.getElementById('assignMentorModal').style.display = 'flex';
    renderTeacherList();
}

function renderTeacherList(search = '') {
    const listDiv = document.getElementById('teacherList');
    const filtered = allTeachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    listDiv.innerHTML = filtered.map(t => `
        <div class="select-mentor-btn" data-id="${t._id}" 
             style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; border-radius: 8px;"
             onmouseenter="this.style.backgroundColor='var(--primary-light)';" 
             onmouseleave="this.style.backgroundColor='transparent';">
             <div>
                <div style="font-weight: 600; color: var(--text-dark);">${t.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${t.designation || 'Faculty'}</div>
             </div>
             <i class="fa-solid fa-chevron-right" style="color: var(--primary);"></i>
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

    const firstName = user.name ? user.name.split(' ')[0] : 'HOD';
    if (userNameEl) userNameEl.innerText = `Hello, ${firstName}`;
    if (userProfileEl) userProfileEl.style.display = 'flex';
    if (userDetailsEl) {
        const badge = document.querySelector('.role-badge-mini');
        if (badge) {
            badge.textContent = 'HOD';
        }
        userDetailsEl.innerHTML = `
            <strong style="font-size: 1rem; color: var(--text-dark);">${user.name || 'User'}</strong>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; margin-left: 6px;">(ID: ${user.employeeId || user.rollNumber || user.identifier || 'N/A'})</span>
        `;
    }
}

// Expose handlers to window for inline onclick execution
window.loadStudentsForMentorship = loadStudentsForMentorship;
window.openBatchAssignModal = openBatchAssignModal;
window.openAssignModal = openAssignModal;
window.assignMentor = assignMentor;
