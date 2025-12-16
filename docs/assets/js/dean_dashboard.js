const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'dean' && user.role !== 'admin') {
        alert('Unauthorized access.');
        window.location.href = '../index.html';
        return;
    }

    loadStats();
    loadLeaves();
    loadComplaints();
});

async function loadStats() {
    const statsGrid = document.getElementById('deanStats');
    try {
        const res = await fetchWithAuth(`${API_BASE}/dean/stats`);
        if (!res) return; // Error handled by fetchWithAuth usually or null

        const { totalHostelers, pendingLeaves, openComplaints } = res;

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background: #e0f2fe; color: #0284c7;"><i class="fa-solid fa-users"></i></div>
                <div class="stat-info">
                    <h3>${totalHostelers}</h3>
                    <p>Total Hostelers</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #fef9c3; color: #ca8a04;"><i class="fa-solid fa-clock"></i></div>
                <div class="stat-info">
                    <h3>${pendingLeaves}</h3>
                    <p>Pending Leaves</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #fee2e2; color: #dc2626;"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div class="stat-info">
                    <h3>${openComplaints}</h3>
                    <p>Open Complaints</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);
        statsGrid.innerHTML = '<p>Error loading stats</p>';
    }
}

async function loadLeaves() {
    const tbody = document.getElementById('leaveTableBody');
    try {
        const leaves = await fetchWithAuth(`${API_BASE}/dean/leaves`);
        if (!leaves || leaves.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1rem;">No leave requests found.</td></tr>';
            return;
        }

        const pendingLeaves = leaves.filter(l => l.status === 'Pending');

        if (pendingLeaves.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1rem; color:#64748b;">No pending leaves.</td></tr>';
            return;
        }

        tbody.innerHTML = pendingLeaves.map(leave => {
            const student = leave.student || { name: 'Unknown', hostelName: 'N/A', roomNumber: 'N/A' };
            const start = new Date(leave.startDate).toLocaleDateString();
            const end = new Date(leave.endDate).toLocaleDateString();

            return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 1rem;">
                    <strong>${student.name}</strong><br>
                    <span style="font-size:0.8rem; color:#64748b;">${student.rollNumber || ''}</span>
                </td>
                <td style="padding: 1rem;">${student.hostelName || '-'} / ${student.roomNumber || '-'}</td>
                <td style="padding: 1rem;"><span class="badge ${leave.type === 'Medical' ? 'badge-red' : 'badge-blue'}">${leave.type}</span></td>
                <td style="padding: 1rem;">${start} - ${end}</td>
                <td style="padding: 1rem;">${leave.reason}</td>
                <td style="padding: 1rem; text-align: center;">
                    <button onclick="updateLeave('${leave._id}', 'Approved')" style="background:#10b981; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-right:5px;"><i class="fa-solid fa-check"></i></button>
                    <button onclick="updateLeave('${leave._id}', 'Rejected')" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                </td>
            </tr>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error loading leaves.</td></tr>';
    }
}

async function updateLeave(id, status) {
    const remark = prompt(`Enter remark for ${status}:`, status === 'Approved' ? 'Granted' : 'Not Allowed');
    if (!remark) return;

    try {
        const res = await fetch(`${API_BASE}/dean/leave/${id}`, {
            method: 'PUT', // Assuming PUT for update
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
            },
            body: JSON.stringify({ status, remark })
        });

        if (res.ok) {
            alert(`Leave ${status} successfully.`);
            loadLeaves();
            loadStats();
        } else {
            alert('Failed to update leave.');
        }
    } catch (error) {
        console.error(error);
        alert('Error updating leave.');
    }
}

async function loadComplaints() {
    const list = document.getElementById('complaintList');
    try {
        const complaints = await fetchWithAuth(`${API_BASE}/dean/complaints`); // Should filter by Hostel category
        if (!complaints || complaints.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:1rem; color:#64748b;">No hostel complaints.</div>';
            return;
        }

        list.innerHTML = complaints.map(c => {
            const student = c.student || { name: 'Unknown' };
            const date = new Date(c.createdAt).toLocaleDateString();
            return `
             <div class="list-card" style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h4 style="margin-bottom:5px; color:#2d3748;">${c.title} <span style="font-size:0.8rem; background:#fee2e2; color:#dc2626; padding:2px 6px; border-radius:4px;">${c.priority}</span></h4>
                    <p style="font-size:0.9rem; color:#4b5563; margin-bottom:5px;">${c.description}</p>
                    <div style="font-size:0.8rem; color:#64748b;">
                        By: ${student.name} (${student.hostelName || 'N/A'}) | ${date}
                    </div>
                </div>
                <div>
                    <span style="font-size:0.85rem; padding:4px 8px; border-radius:12px; background:${c.status === 'Resolved' ? '#dcfce7' : '#f1f5f9'}; color:${c.status === 'Resolved' ? '#166534' : '#475569'};">${c.status}</span>
                </div>
             </div>
             `;
        }).join('');

    } catch (error) {
        console.error(error);
        list.innerHTML = '<div>Error loading complaints.</div>';
    }
}

// Helper (Normally imported from api.js but keeping standalone for safety/simplicity in this file)
// Actually we included api.js in HTML, so we can use fetchWithAuth if it's GLOBAL.
// Assuming fetchWithAuth is global in api.js.
