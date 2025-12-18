const API_URL = 'http://localhost:5000/api/hod';

// State
let allTeachers = [];
let currentStudentId = null;

document.addEventListener('DOMContentLoaded', async () => {
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

async function loadStudentsForMentorship() {
    const year = document.getElementById('mentorYearFilter').value;
    const b1List = document.getElementById('batch1List');
    const b2List = document.getElementById('batch2List');

    b1List.innerHTML = '<div class="loading-spinner"></div>';
    b2List.innerHTML = '<div class="loading-spinner"></div>';

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const res = await fetch(`${API_URL}/students`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const allStudents = await res.json();

        // Filter by Year (Client side for now as getStudents returns all for dept)
        const yearFiltered = allStudents.filter(s => s.year === year || s.batch === year);

        // Split by Batch (Mock split or using available data)
        renderStudentList(b1List, yearFiltered.slice(0, Math.ceil(yearFiltered.length / 2)));
        renderStudentList(b2List, yearFiltered.slice(Math.ceil(yearFiltered.length / 2)));

    } catch (err) {
        console.error(err);
        b1List.innerHTML = 'Error loading students';
    }
}

function renderStudentList(container, students) {
    if (students.length === 0) {
        container.innerHTML = '<div style="color:#94a3b8; font-style:italic;">No students found</div>';
        return;
    }

    container.innerHTML = students.map(s => {
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
}

function openAssignModal(studentId, studentName) {
    currentStudentId = studentId;
    document.getElementById('assignModalTitle').innerText = `Assign Mentor to ${studentName}`;
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
    if (!currentStudentId) return;

    try {
        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr);

        const res = await fetch(`${API_URL}/students/assign-mentor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ studentId: currentStudentId, teacherId })
        });

        if (res.ok) {
            alert('Mentor Assigned Successfully');
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
