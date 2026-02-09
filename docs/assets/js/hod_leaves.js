const API_URL = 'http://localhost:5000/api/hod';
let currentRejectId = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadLeaves();
});

async function loadLeaves() {
    const tableBody = document.getElementById('leavesTableBody');
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/leaves`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '../login.html';
            return;
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Status: ${response.status} ${response.statusText} - ${errText}`);
        }

        const leaves = await response.json();

        if (leaves.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#64748b;">No leave history found.</td></tr>';
            return;
        }

        tableBody.innerHTML = leaves.map(leave => {
            const startDate = new Date(leave.startDate).toLocaleDateString();
            const endDate = new Date(leave.endDate).toLocaleDateString();

            let actionButtons = '';
            let statusBadge = '';

            let hStatus = leave.hodStatus || (leave.status === 'Pending HOD Approval' ? 'Pending' : 'Approved'); // Fallback
            if (leave.status && leave.status.includes('Pending HOD')) hStatus = 'Pending';
            // Actually trust hodStatus mainly if present
            if (leave.hodStatus) hStatus = leave.hodStatus;

            if (hStatus === 'Pending') {
                actionButtons = `
                    <div style="display:flex; gap:10px;">
                        <button onclick="approveLeave('${leave._id}')" 
                            style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600;">
                            <i class="fa-solid fa-check"></i> Approve
                        </button>
                        <button onclick="openRejectModal('${leave._id}')" 
                            style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600;">
                            <i class="fa-solid fa-xmark"></i> Reject
                        </button>
                    </div>
                `;
            } else if (hStatus === 'Approved') {
                statusBadge = `<span style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:10px; font-weight:600; font-size:0.85rem;">Approved</span>`;
            } else if (hStatus === 'Rejected') {
                statusBadge = `<span style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:10px; font-weight:600; font-size:0.85rem;">Rejected</span>`;
            } else {
                statusBadge = `<span style="background:#e2e8f0; color:#475569; padding:4px 8px; border-radius:10px; font-weight:600; font-size:0.85rem;">${leave.status}</span>`;
            }

            return `
            <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:1rem;">
                    <div style="font-weight:600; color:#2d3748;">${leave.student?.name || 'Unknown'}</div>
                    <div style="font-size:0.8rem; color:#64748b;">${leave.student?.rollNumber || ''}</div>
                </td>
                <td style="padding:1rem;">
                    <span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:10px; font-size:0.8rem; font-weight:600;">${leave.type}</span>
                </td>
                <td style="padding:1rem; font-size:0.9rem;">${startDate} - ${endDate}</td>
                <td style="padding:1rem; color:#475569;">${leave.reason}</td>
                <td style="padding:1rem;">
                    ${hStatus === 'Pending' ? actionButtons : statusBadge}
                </td>
            </tr>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error loading leaves. <br><small>${error.message}</small></td></tr>`;
    }
}

async function approveLeave(id) {
    if (!confirm('Approve this application?')) return;
    await processAction(id, 'approve');
}

function openRejectModal(id) {
    currentRejectId = id;
    document.getElementById('rejectModal').style.display = 'flex';
}

function closeRejectModal() {
    currentRejectId = null;
    document.getElementById('rejectModal').style.display = 'none';
    document.getElementById('rejectRemark').value = '';
}

async function confirmReject() {
    const remark = document.getElementById('rejectRemark').value;
    if (!remark) {
        alert('Please provide a reason for rejection.');
        return;
    }
    await processAction(currentRejectId, 'reject', remark);
    closeRejectModal();
}

async function processAction(id, action, remark = '') {
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/leaves/${id}/action`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ action, remark })
        });

        if (response.ok) {
            alert(action === 'approve' ? 'Approved successfully' : 'Rejected successfully');
            loadLeaves();
        } else {
            const data = await response.json();
            alert(data.message || 'Action failed');
        }
    } catch (error) {
        console.error(error);
        alert('Server Error');
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
