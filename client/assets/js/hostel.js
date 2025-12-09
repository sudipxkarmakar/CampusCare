// Auth Check
const userStr = localStorage.getItem('user');
if (!userStr) window.location.href = '../login.html';
const user = JSON.parse(userStr);

document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    loadLeaves();

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
        const res = await fetch('http://localhost:5000/api/hostel/menu');
        const menu = await res.json();
        
        const tbody = document.querySelector('#mess-menu-table tbody');
        if (!tbody) return;

        let html = '';
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        for (const [day, meals] of Object.entries(menu)) {
            const isToday = day === today ? 'today-row' : '';
            html += `
                <tr class="${isToday}">
                    <td>${day} ${day === today ? '<span style="font-size:0.7em; background:red; color:white; padding:2px 4px; border-radius:4px;">TODAY</span>' : ''}</td>
                    <td>${meals.Breakfast}</td>
                    <td>${meals.Lunch}</td>
                    <td>${meals.Dinner}</td>
                </tr>
            `;
        }
        tbody.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}

async function loadLeaves() {
    const list = document.getElementById('leave-history');
    const statusCount = document.getElementById('leave-status-count');
    
    try {
        const res = await fetch(`http://localhost:5000/api/hostel/leave/${user._id}`);
        const leaves = await res.json();
        
        if (statusCount) statusCount.innerText = `${leaves.length} Applications`;

        if (leaves.length === 0) {
            list.innerHTML = '<p class="muted">No leave history.</p>';
            return;
        }

        let html = '';
        leaves.forEach(l => {
            let color = '#f59e0b'; // Pending
            if (l.status === 'Approved') color = '#10b981';
            if (l.status === 'Rejected') color = '#ef4444';

            html += `
                <div style="padding:0.8rem; border-bottom:1px solid rgba(0,0,0,0.1); display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:600;">${l.type}</div>
                        <div style="font-size:0.8rem; color:#64748b;">${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()}</div>
                    </div>
                    <span style="color:${color}; font-weight:bold; font-size:0.85rem;">${l.status.toUpperCase()}</span>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (err) {
        console.error(err);
    }
}
