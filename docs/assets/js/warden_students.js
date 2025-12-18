const API_URL = 'http://localhost:5000/api/warden';

document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    setupSearch();
    checkAuth();
});

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) window.location.href = '../login.html';
    const user = JSON.parse(userStr);
    if (user.role !== 'warden' && user.role !== 'admin') {
        window.location.href = '../index.html';
    }
}

let allStudents = [];

async function loadStudents() {
    const user = JSON.parse(localStorage.getItem('user'));
    const tableBody = document.getElementById('studentTableBody');

    try {
        const response = await fetch(`${API_URL}/students`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch students');

        allStudents = await response.json();
        renderTable(allStudents);

    } catch (error) {
        console.error('Error fetching students:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:2rem; color:#ef4444;">
                    <i class="fa-solid fa-circle-exclamation"></i> Error loading student list. <br>
                    <small>${error.message}</small>
                </td>
            </tr>
        `;
    }
}

function renderTable(students) {
    const tableBody = document.getElementById('studentTableBody');
    const noResults = document.getElementById('noResults');

    if (students.length === 0) {
        tableBody.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    tableBody.innerHTML = students.map(student => `
        <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
            <td style="padding:1rem; display:flex; align-items:center; gap:10px;">
                <img src="${student.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}" 
                    style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid #e2e8f0;">
                <div>
                    <div style="font-weight:600; color:#1e293b;">${student.name}</div>
                    <div style="font-size:0.8rem; color:#64748b;">${student.email}</div>
                </div>
            </td>
            <td style="padding:1rem; color:#475569; font-weight:500;">${student.rollNumber || '-'}</td>
            <td style="padding:1rem;">
                <span style="background:#eff6ff; color:#3b82f6; padding:2px 8px; border-radius:4px; font-size:0.85rem; font-weight:600;">${student.department || 'N/A'}</span>
                <span style="margin-left:5px; color:#64748b; font-size:0.9rem;">${student.year || ''}</span>
            </td>
            <td style="padding:1rem;">
                <div style="font-weight:600; color:#1e293b;">${student.hostelName || 'Not Assigned'}</div>
                <div style="color:#64748b; font-size:0.9rem;">Room: ${student.roomNumber || '-'}</div>
            </td>
            <td style="padding:1rem; color:#475569;">${student.contactNumber || '-'}</td>
            <td style="padding:1rem;">
                <button onclick="viewStudentDetails('${student._id}')" 
                    style="background:transparent; border:1px solid #cbd5e1; padding:5px 10px; border-radius:6px; cursor:pointer; color:#475569; hover:bg-slate-100;">
                    <i class="fa-regular fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function setupSearch() {
    const searchInput = document.getElementById('studentSearch');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allStudents.filter(s =>
            (s.name && s.name.toLowerCase().includes(term)) ||
            (s.rollNumber && s.rollNumber.toLowerCase().includes(term)) ||
            (s.department && s.department.toLowerCase().includes(term)) ||
            (s.hostelName && s.hostelName.toLowerCase().includes(term)) ||
            (s.roomNumber && s.roomNumber.toLowerCase().includes(term))
        );
        renderTable(filtered);
    });
}



function viewStudentDetails(id) {
    const student = allStudents.find(s => s._id === id);
    if (!student) return;

    // Populate Modal
    const profilePic = student.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;
    document.getElementById('modalImg').src = profilePic;
    document.getElementById('modalName').innerText = student.name;
    document.getElementById('modalRoll').innerText = `Roll No: ${student.rollNumber || 'Not Assigned'}`;

    document.getElementById('modalDept').innerText = student.department || 'N/A';
    document.getElementById('modalYear').innerText = student.year || student.batch || 'N/A';
    document.getElementById('modalHostel').innerText = student.hostelName || 'Not Assigned';
    document.getElementById('modalRoom').innerText = student.roomNumber || 'Not Assigned';

    document.getElementById('modalEmail').innerText = student.email || '-';
    document.getElementById('modalContact').innerText = student.contactNumber || 'Not Provided';

    // Show Modal
    const modal = document.getElementById('studentModal');
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('studentModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('studentModal');
    if (event.target == modal) {
        closeModal();
    }
}
