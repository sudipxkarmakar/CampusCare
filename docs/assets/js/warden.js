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

        // Fetch and render residents list preview
        try {
            const studRes = await fetch(`${API_URL}/students`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (studRes.ok) {
                const hostelers = await studRes.json();
                renderResidentsPreview(hostelers);
            }
        } catch (e) {
            console.error('Error fetching hostelers list:', e);
        }

    } catch (error) {
        console.error(error);
        const hostelerCountVal = document.getElementById('hostelerCountVal');
        if (hostelerCountVal) hostelerCountVal.innerText = '-';
    }
}

function renderResidentsPreview(hostelers) {
    const tbody = document.getElementById('residents-table-body');
    if (!tbody) return;

    if (!hostelers || hostelers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No residents registered in this hostel yet.</td></tr>`;
        return;
    }

    let html = '';
    // Show top 5 hostelers
    hostelers.slice(0, 5).forEach(student => {
        const name = student.name || 'Resident';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
        const room = student.roomNumber ? `Room ${student.roomNumber}` : 'N/A';
        const batch = student.batch || student.year || 'N/A';
        const email = student.email || '';
        
        html += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%;">
                        <div>
                            <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-dark);">${name}</span>
                            <span style="display:block; font-size:0.75rem; color: var(--text-muted);">${email}</span>
                        </div>
                    </div>
                </td>
                <td style="font-size: 0.85rem; font-weight: 600; color: var(--text-dark);">${room}</td>
                <td style="font-size: 0.85rem; color: var(--text-muted);">${batch}</td>
                <td>
                    <span style="background: #d1fae5; color: #059669; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 700;">Active</span>
                </td>
                <td style="text-align: right;">
                    <a href="../modules/student-database/view.html" style="color: var(--success); text-decoration: none;"><i class="fa-solid fa-eye" style="cursor: pointer;"></i></a>
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


