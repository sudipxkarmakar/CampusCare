// Global store for mentees
let loadedMentees = [];

document.addEventListener('DOMContentLoaded', loadMyMentees);

async function loadMyMentees() {
    const tableBody = document.getElementById('menteesTableBody');
    if (!tableBody) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:red;">Please login.</td></tr>';
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const response = await fetch('http://localhost:5000/api/teacher/my-mentees', {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch mentees');
        }

        const mentees = await response.json();
        loadedMentees = mentees; // Store for modal usage

        if (mentees.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:#64748b;">No mentees assigned.</td></tr>';
            return;
        }

        tableBody.innerHTML = mentees.map(student => {
            const attendance = parseFloat(student.attendance || 0);

            return `
            <tr style="border-bottom:1px solid #f1f5f9; transition:0.2s;">
                <td style="padding:15px; font-weight:600; color:#334155;">${student.rollNumber || 'N/A'}</td>
                <td style="padding:15px;">
                    <div style="font-weight:600; color:#2d3748;">${student.name}</div>
                    <div style="font-size:0.75rem; color:#64748b;">Batch ${student.batch || 'N/A'}</div>
                </td>
                <td style="padding:15px; text-align:center;">
                    <span style="font-weight:700; ${attendance < 75 ? 'color:#dc2626;' : 'color:#166534;'}">${attendance}%</span>
                </td>
                <td style="padding:15px; text-align:center;">
                    ${student.mar || 0}
                </td>
                <td style="padding:15px; text-align:center;">
                    ${student.moocs || 0}
                </td>
                <td style="padding:15px; text-align:center; font-weight:700; color:#0f172a;">${student.cgpa || 'N/A'}</td>
                <td style="padding:15px;">
                    <button 
                        style="background:#8b5cf6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; transition: background 0.3s ease;"
                        onmouseover="this.style.background='#7c3aed'"
                        onmouseout="this.style.background='#8b5cf6'"
                        onclick="viewFullProfile('${student._id}')">View</button>
                </td>
            </tr>
            `;
        }).join('');

        const countBadge = document.querySelector('.fa-users').parentNode;
        if (countBadge && countBadge.textContent.includes('Mentees')) {
            countBadge.innerHTML = `<i class="fa-solid fa-users"></i> ${mentees.length} Mentees`;
        }

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:red;">Error loading mentees.</td></tr>';
    }
}

function viewFullProfile(studentId) {
    const student = loadedMentees.find(s => s._id === studentId);
    if (!student) {
        alert("Student data not found.");
        return;
    }

    // Populate Modal
    // Header
    let profilePic = student.profilePicture;
    if (profilePic) {
        if (profilePic.startsWith('/')) {
            profilePic = `http://localhost:5000${profilePic}`;
        } else if (!profilePic.startsWith('http')) {
            profilePic = `http://localhost:5000/${profilePic}`;
        }
    } else {
        profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;
    }

    document.getElementById('modalImg').src = profilePic;
    document.getElementById('modalName').innerText = student.name;
    document.getElementById('modalRoll').innerText = `Roll No: ${student.rollNumber || 'Not Assigned'}`;

    // Personal
    document.getElementById('modalEmail').innerText = student.email || '-';
    document.getElementById('modalContact').innerText = student.mobile || student.contactNumber || 'Not Provided';
    document.getElementById('modalBlood').innerText = student.bloodGroup || 'Unknown';

    // Academic
    document.getElementById('modalDept').innerText = student.department || 'N/A';
    document.getElementById('modalYear').innerText = `${student.year || ''} (${student.passOutYear || 'N/A'})`;
    document.getElementById('modalBatch').innerText = `${student.batch || 'N/A'} / ${student.subBatch || '-'}`;

    // Campus Life / Stats
    const hostelGroup = document.getElementById('hostelInfoGroup');
    if (student.hostelName) {
        hostelGroup.style.display = 'block';
        document.getElementById('modalHostel').innerText = `${student.hostelName} - ${student.roomNumber}`;
    } else {
        hostelGroup.style.display = 'none';
    }

    document.getElementById('modalCGPA').innerText = student.cgpa || '0.0';
    document.getElementById('modalAttendance').innerText = `${student.attendance || 0}%`;
    document.getElementById('modalMAR').innerText = student.mar || 0;
    document.getElementById('modalMOOCs').innerText = student.moocs || 0;

    // Show Modal
    const modal = document.getElementById('studentModal');
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('studentModal').style.display = 'none';
}

// Close on outside click
window.onclick = function (event) {
    const modal = document.getElementById('studentModal');
    if (event.target == modal) {
        closeModal();
    }
}
