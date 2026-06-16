var API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api/warden';

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    setupProfile();
});

async function loadDashboardStats() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);

    // Verify Role
    if (user.role !== 'warden' && user.role !== 'admin') {
        alert('Unauthorized Access');
        window.location.href = '../index.html';
        return;
    }

    try {
        // Fetch dashboard stats
        const response = await fetch(`${API_URL}/dashboard`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load stats');

        const data = await response.json();

        // Populate counts
        const hostelerCountVal = document.getElementById('hostelerCountVal');
        if (hostelerCountVal) hostelerCountVal.innerText = data.hostelerCount;

        const insightHostelerCount = document.getElementById('insight-hosteler-count');
        if (insightHostelerCount) insightHostelerCount.innerText = data.hostelerCount;

        const leaveCountVal = document.getElementById('leaveCountVal');
        if (leaveCountVal) leaveCountVal.innerText = data.pendingLeaves || 0;

        const leaveBadge = document.getElementById('leaveCountBadge');
        if (leaveBadge) {
            leaveBadge.innerText = data.pendingLeaves || 0;
            if (data.pendingLeaves > 0) leaveBadge.style.display = 'flex';
            else leaveBadge.style.display = 'none';
        }

        // Fetch complaints to count pending ones
        try {
            const compRes = await fetch(`${API_URL}/complaints`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (compRes.ok) {
                const complaints = await compRes.json();
                const pendingComplaints = complaints.filter(c => c.status !== 'Resolved').length;
                const complaintsCountVal = document.getElementById('complaintsCountVal');
                if (complaintsCountVal) {
                    complaintsCountVal.innerText = pendingComplaints;
                }
            }
        } catch (e) {
            console.error('Error fetching complaints:', e);
        }

        // Fetch and render leaves list preview
        try {
            const leavesRes = await fetch(`${API_URL}/leaves`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (leavesRes.ok) {
                const leaves = await leavesRes.json();
                renderLeavesTrackingPreview(leaves);
            }
        } catch (e) {
            console.error('Error fetching leaves list:', e);
        }

    } catch (error) {
        console.error(error);
        const hostelerCountVal = document.getElementById('hostelerCountVal');
        if (hostelerCountVal) hostelerCountVal.innerText = '-';
    }
}

function renderLeavesTrackingPreview(leaves) {
    const tbody = document.getElementById('leaves-tracking-table-body');
    if (!tbody) return;

    if (!leaves || leaves.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No leave applications found.</td></tr>`;
        return;
    }

    let html = '';
    // Show top 5 recent leaves
    leaves.slice(0, 5).forEach(leave => {
        const studentName = leave.student?.name || 'Resident';
        const email = leave.student?.email || '';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`;
        
        const leaveType = leave.type || 'Leave';
        const startDate = new Date(leave.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const endDate = new Date(leave.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const duration = `${startDate} - ${endDate}`;

        // HOD Status
        let hStatus = leave.hodStatus || 'Pending';
        let hodBg = 'background: #fee2e2; color: #ef4444;';
        if (hStatus === 'Approved') hodBg = 'background: #d1fae5; color: #10b981;';
        else if (hStatus === 'Rejected') hodBg = 'background: #fee2e2; color: #ef4444;';

        // Warden Status
        let wStatus = leave.wardenStatus || 'Pending';
        let wardenBg = 'background: #fee2e2; color: #ef4444;';
        if (wStatus === 'Approved') wardenBg = 'background: #d1fae5; color: #10b981;';
        else if (wStatus === 'Rejected') wardenBg = 'background: #fee2e2; color: #ef4444;';

        html += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%;">
                        <div>
                            <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-dark);">${studentName}</span>
                            <span style="display:block; font-size:0.75rem; color: var(--text-muted);">${email}</span>
                        </div>
                    </div>
                </td>
                <td style="font-size: 0.85rem; font-weight: 600; color: var(--text-dark);">${leaveType}</td>
                <td style="font-size: 0.85rem; color: var(--text-muted);">${duration}</td>
                <td>
                    <span style="${hodBg} padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 700;">${hStatus}</span>
                </td>
                <td>
                    <span style="${wardenBg} padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 700;">${wStatus}</span>
                </td>
                <td style="text-align: right;">
                    <a href="../modules/gate-pass/approve.html" style="color: var(--success); text-decoration: none;"><i class="fa-solid fa-stamp" style="cursor: pointer;"></i></a>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function setupProfile() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('userProfile').style.display = 'flex';
        document.getElementById('userName').innerText = `Hello, ${user.name}`;
        
        const greetingName = document.getElementById('warden-name');
        if (greetingName) greetingName.innerText = user.name;
        
        document.getElementById('userDetails').innerHTML = `<strong>${user.role.toUpperCase()}</strong><br>${user.email}<br>${user.hostelName || 'Hostel Admin'}`;
    }
}


