const userStr = localStorage.getItem('user');
if (!userStr) window.location.href = '../login.html';
const user = JSON.parse(userStr);

document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    loadLeaves();
    loadNotices();
    loadComplaints();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = '../index.html';
        });
    }

    const leaveForm = document.getElementById('leaveForm');
    if (leaveForm) {
        leaveForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                studentId: user._id,
                type: document.getElementById('type').value,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                reason: document.getElementById('reason').value
            };

            try {
                const res = await api.post('/hostel/leave', data);
                if (res._id) {
                    alert('Leave Application Submitted to Mentor');
                    leaveForm.reset();
                    loadLeaves();
                } else {
                    alert('Error: ' + res.message);
                }
            } catch (err) {
                console.error(err);
                alert('Submission failed');
            }
        });
    }
});

async function loadMenu() {
    try {
        const res = await fetch('http://localhost:5000/api/hostel/menu');
        if (!res.ok) throw new Error("Server offline");
        const menu = await res.json();

        const tbody = document.querySelector('#mess-menu-table tbody');
        if (!tbody) return;

        let html = '';
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        daysOrder.forEach(day => {
            const meals = menu[day];
            if (!meals) return;

            const isToday = day === today ? 'today-row' : '';
            html += `
                <tr class="${isToday}">
                    <td>${day}</td>
                    <td>${meals.Breakfast}</td>
                    <td>${meals.Lunch}</td>
                    <td>${meals.Dinner}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error("Menu Load Error:", err);
        const tbody = document.querySelector('#mess-menu-table tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Failed to load menu from server.</td></tr>';
    }
}

async function loadNotices() {
    const list = document.getElementById('hostel-notices-list');
    if (!list) return;

    try {
        // Fetch notices with audience 'hosteler' or 'general'
        // Using general notices endpoint for now, ideally /api/notices?audience=hosteler
        const res = await fetch('http://localhost:5000/api/notices?role=hosteler');
        if (!res.ok) throw new Error("Failed to fetch notices");
        const allNotices = await res.json();

        // Filter for hostel related
        const data = allNotices.filter(n => n.audience === 'hosteler' || n.audience === 'general').slice(0, 5);

        if (data.length === 0) {
            list.innerHTML = '<p style="padding:10px; color:#666;">No hostel notices.</p>';
            return;
        }

        let html = '';
        html += `<table style="width:100%; border-collapse: collapse;"><tbody>`;

        data.forEach(n => {
            html += `
                <tr class="item-row" style="cursor:pointer; transition:0.2s;">
                    <td style="padding:0.8rem 0.5rem; border-bottom:1px solid rgba(203, 213, 225, 0.5);">
                        <div style="font-weight:600; color:#374151; margin-bottom:0.2rem;">${n.title}</div>
                        <div style="font-size:0.85rem; color:#64748b;">${new Date(n.date).toLocaleDateString()}</div>
                    </td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        list.innerHTML = html;
    } catch (e) {
        console.error(e);
        list.innerHTML = '<p style="padding:10px; color:red;">Error loading notices.</p>';
    }
}

async function loadLeaves() {
    const list = document.getElementById('leave-history');
    const statusCount = document.getElementById('leave-status-count');

    try {
        const res = await fetch(`http://localhost:5000/api/hostel/leave/${user._id}`);
        if (!res.ok) throw new Error("Server offline");
        const leaves = await res.json();

        if (statusCount) statusCount.innerHTML = `<i class="fa-solid fa-layer-group"></i> Total: ${leaves.length}`;

        if (leaves.length === 0) {
            list.innerHTML = '<p class="muted">No leave history.</p>';
            return;
        }

        let html = `
            <div style="height:100%; display:flex; flex-direction:column; overflow:hidden;">
                <div style="flex:1; overflow-y:auto;">
                    <table class="status-table" style="width:100%;">
                        <thead>
                            <tr style="position: sticky; top: 0; background: #f8fafc; z-index: 1;">
                                <th>Type</th>
                                <th>Reason</th>
                                <th>Dates</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        leaves.forEach(l => {
            let badgeBg = '#fef3c7'; // yellow-50
            let badgeColor = '#d97706'; // yellow-600
            let icon = '<i class="fa-regular fa-clock"></i>';

            if (l.status === 'Approved') {
                badgeBg = '#dcfce7'; // green-100
                badgeColor = '#16a34a'; // green-600
                icon = '<i class="fa-solid fa-check"></i>';
            } else if (l.status === 'Rejected') {
                badgeBg = '#fee2e2'; // red-100
                badgeColor = '#dc2626'; // red-600
                icon = '<i class="fa-solid fa-xmark"></i>';
            } else if (l.status === 'Pending') {
                // Explicitly keeping default, but good for clarity
                badgeBg = '#fff7ed'; // orange-50
                badgeColor = '#ea580c'; // orange-600
                icon = '<i class="fa-solid fa-hourglass-half"></i>';
            }

            html += `
                <tr>
                    <td style="font-weight:600; white-space:nowrap;">${l.type}</td>
                    <td style="color:#4b5563; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${l.reason}">${l.reason}</td>
                    <td style="font-size:0.75rem; color:#64748b; white-space:nowrap;">
                        ${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td>
                        <span class="badge-status" style="background:${badgeBg}; color:${badgeColor}; display:inline-flex; align-items:center; gap:4px;">
                            ${icon} ${l.status}
                        </span>
                    </td>
                </tr>
            `;
        });

        html += `   </tbody>
                    </table>
                </div>
            </div>`;

        list.innerHTML = html;
    } catch (err) {
        console.error(err);
        if (list) list.innerHTML = '<p style="color:red">Failed to load history.</p>';
    }
}

async function loadComplaints() {
    const list = document.getElementById('student-complaints-list');
    if (!list) return;

    try {
        // Fetch my complaints (reusing general complaints API or specific endpoint)
        // Assuming /api/complaints/my returns complaints for logged in user if token sent, 
        // or we filter client side from /api/complaints but that's public wall.
        // Let's assume there is an endpoint or we try to hit the main one.
        // Actually, for "My Complaints" we usually sort by user ID. 
        // Let's try /api/complaints?studentId=${user._id} if supported, else filter.

        const res = await fetch('http://localhost:5000/api/complaints');
        if (!res.ok) throw new Error("Failed");
        const all = await res.json();

        // Filter for this user
        const data = all.filter(c => c.student && (c.student._id === user._id || c.student === user._id));

        let html = '';
        if (data.length === 0) {
            list.innerHTML = '<p>No complaints filed yet.</p>';
            return;
        }

        data.forEach(c => {
            let color = '#f59e0b'; // pending
            if (c.status === 'Resolved') color = '#10b981';

            html += `
                <div class="item-row" style="padding:0.8rem; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center; transition:0.2s;">
                    <div>
                        <div style="font-weight:600; color:#1f2937;">${c.title}</div>
                        <div style="font-size:0.85rem; color:#64748b;">${new Date(c.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span style="font-size:0.8rem; font-weight:bold; color:${color}; border:1px solid ${color}; padding:2px 6px; border-radius:4px;">${c.status}</span>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (e) {
        list.innerHTML = '<p style="color:red">Error loading status.</p>';
    }
}

