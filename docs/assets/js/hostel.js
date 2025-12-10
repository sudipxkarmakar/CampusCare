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
                    alert('Leave Application Submitted to Warden');
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
        let menu;
        try {
            const res = await fetch('http://localhost:5000/api/hostel/menu');
            if (!res.ok) throw new Error("Server offline");
            menu = await res.json();
        } catch (e) {
            menu = {
                'Monday': { Breakfast: 'Aloo Paratha', Lunch: 'Rajma Rice', Dinner: 'Egg Curry / Paneer' },
                'Tuesday': { Breakfast: 'Idli Sambar', Lunch: 'Curd Rice & Alu Fry', Dinner: 'Chicken / Mushroom' },
                'Wednesday': { Breakfast: 'Poha', Lunch: 'Dal Makhani', Dinner: 'Mix Veg' },
                'Thursday': { Breakfast: 'Sandwich', Lunch: 'Chole Bhature', Dinner: 'Veg Biryani' },
                'Friday': { Breakfast: 'Puri Sabzi', Lunch: 'Fried Rice', Dinner: 'Fish / Kadhai Paneer' },
                'Saturday': { Breakfast: 'Dosa', Lunch: 'Khichdi', Dinner: 'Pizza / Pasta' },
                'Sunday': { Breakfast: 'Cornflakes', Lunch: 'Special Thali', Dinner: 'Burgers' }
            };
        }

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
        console.error("Critical Menu Error:", err);
        const tbody = document.querySelector('#mess-menu-table tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Failed to load menu.</td></tr>';
    }
}

function loadNotices() {
    const list = document.getElementById('hostel-notices-list');
    if (!list) return;

    const data = [
        { title: ' Power Cut Scheduled', date: 'Tomorrow, 2:00 PM - 4:00 PM', priority: 'High' },
        { title: ' Mass Cleanliness Drive', date: 'Sunday, 9:00 AM', priority: 'Medium' },
        { title: ' Hostel Night Registration', date: 'Deadline: Friday', priority: 'Low' },
        { title: ' Water Tank Cleaning', date: 'Next Monday', priority: 'Low' }
    ];

    let html = '';
    html += `<table style="width:100%; border-collapse: collapse;"><tbody>`;

    data.forEach(n => {
        html += `
            <tr class="item-row" style="cursor:pointer; transition:0.2s;">
                <td style="padding:0.8rem 0.5rem; border-bottom:1px solid rgba(203, 213, 225, 0.5);">
                    <div style="font-weight:600; color:#374151; margin-bottom:0.2rem;">${n.title}</div>
                    <div style="font-size:0.85rem; color:#64748b;">${n.date}</div>
                </td>
            </tr>
        `;
    });
    html += `</tbody></table>`;
    list.innerHTML = html;
}

async function loadLeaves() {
    const list = document.getElementById('leave-history');
    const statusCount = document.getElementById('leave-status-count');

    try {
        let leaves;
        try {
            const res = await fetch(`http://localhost:5000/api/hostel/leave/${user._id}`);
            if (!res.ok) throw new Error("Server offline");
            leaves = await res.json();
        } catch (e) {
            leaves = [
                { type: 'Night Out', startDate: '2025-03-15', endDate: '2025-03-16', status: 'Pending' },
                { type: 'Home Visit', startDate: '2025-02-20', endDate: '2025-02-25', status: 'Approved' },
                { type: 'Medical', startDate: '2025-01-10', endDate: '2025-01-12', status: 'Rejected' },
                { type: 'Day Out', startDate: '2025-01-05', endDate: '2025-01-05', status: 'Approved' }
            ];
        }

        if (statusCount) statusCount.innerHTML = `<i class="fa-solid fa-layer-group"></i> Total: ${leaves.length}`;

        if (leaves.length === 0) {
            list.innerHTML = '<p class="muted">No leave history.</p>';
            return;
        }

        let html = `
            <div style="height:100%; display:flex; flex-direction:column;">
                <table class="status-table" style="flex:1; height:100%; width:100%;">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        leaves.forEach(l => {
            let badgeBg = '#fef3c7'; // yellow-50
            let badgeColor = '#d97706'; // yellow-600

            if (l.status === 'Approved') {
                badgeBg = '#dcfce7'; // green-100
                badgeColor = '#16a34a'; // green-600
            }
            if (l.status === 'Rejected') {
                badgeBg = '#fee2e2'; // red-100
                badgeColor = '#dc2626'; // red-600
            }

            html += `
                <tr>
                    <td style="font-weight:600;">${l.type}</td>
                    <td style="font-size:0.75rem; color:#64748b;">
                        ${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td>
                        <span class="badge-status" style="background:${badgeBg}; color:${badgeColor};">
                            ${l.status}
                        </span>
                    </td>
                </tr>
            `;
        });

        html += `   </tbody>
                </table>
            </div>`;

        list.innerHTML = html;
    } catch (err) {
        console.error(err);
        if (list) list.innerHTML = '<p style="color:red">Failed to load history.</p>';
    }
}

function loadComplaints() {
    const list = document.getElementById('student-complaints-list');
    if (!list) return;

    const data = [
        { issue: 'Noise Disturbance (Late Night)', date: 'Feb 28', status: 'Warning Issued' },
        { issue: 'Room Cleanliness Check', date: 'Jan 15', status: 'Resolved' }
    ];

    let html = '';
    if (data.length === 0) {
        list.innerHTML = '<p>No complaints found. maintain it!</p>';
        return;
    }

    data.forEach(c => {
        let color = c.status.includes('Warning') ? '#ef4444' : '#10b981';
        html += `
            <div class="item-row" style="padding:0.8rem; border-bottom:1px solid rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center; transition:0.2s;">
                <div>
                    <div style="font-weight:600; color:#1f2937;">${c.issue}</div>
                    <div style="font-size:0.85rem; color:#64748b;">${c.date}</div>
                </div>
                <span style="font-size:0.8rem; font-weight:bold; color:${color}; border:1px solid ${color}; padding:2px 6px; border-radius:4px;">${c.status}</span>
            </div>
        `;
    });
    list.innerHTML = html;
}

