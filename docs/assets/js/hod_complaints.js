const API_URL = 'http://localhost:5000/api/hod';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadComplaints();
});

async function loadComplaints() {
    const tableBody = document.getElementById('complaintsTableBody');
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);

    // Basic Role Check
    if (user.role !== 'hod' && user.role !== 'admin') {
        window.location.href = '../index.html'; // Or show error
        return;
    }


    try {
        const response = await fetch(`${API_URL}/complaints`, {
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

        const complaints = await response.json();

        if (complaints.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#64748b;">No complaints found.</td></tr>';
            return;
        }

        tableBody.innerHTML = complaints.map(c => {
            const against = c.againstUser ? `<span style="color:#ef4444; font-weight:500;">${c.againstUser.name}</span>` : '<span style="color:#94a3b8;">-</span>';
            const statusColor = c.status === 'Resolved' ? '#166534' : (c.status === 'Pending' ? '#ca8a04' : '#1e40af'); // Green, Yellow, Blue
            const statusBg = c.status === 'Resolved' ? '#dcfce7' : (c.status === 'Pending' ? '#fef9c3' : '#dbeafe');

            return `
            <tr style="border-bottom:1px solid #f1f5f9; hover:background:#f8fafc;">
                <td style="padding:1rem;">
                    <div style="font-weight:600; color:#2d3748;">${c.student?.name || 'Unknown'}</div>
                    <div style="font-size:0.8rem; color:#64748b;">${c.student?.rollNumber || ''}</div>
                </td>
                <td style="padding:1rem;">
                    <div style="font-weight:600; color:#475569;">${c.title}</div>
                </td>
                <td style="padding:1rem;">
                    <span style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-size:0.85rem;">${c.category || 'General'}</span>
                </td>
                <td style="padding:1rem;">${against}</td>
                <td style="padding:1rem;">
                    <span style="background:${statusBg}; color:${statusColor}; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:600;">
                        ${c.status}
                    </span>
                </td>
            </tr>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error loading complaints. <br><small>${error.message}</small></td></tr>`;
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
