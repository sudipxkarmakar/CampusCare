const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        // window.location.href = '../login.html'; // Optional: Redirect if strict
    } else {
        const user = JSON.parse(userStr);
        // document.getElementById('userName').innerText = `Hello, ${user.name}`;
        // Load User specific data like leaves if logged in
        loadMyLeaves();
    }

    loadMessMenu();
    loadHostelNotices();


    const leaveForm = document.getElementById('leaveForm');
    if (leaveForm) {
        leaveForm.addEventListener('submit', handleLeaveSubmit);

        // Initialize Flatpickr Logic for Linked Dates
        const startDatePicker = flatpickr("#startDate", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            altInput: true,
            altFormat: "d/m/Y H:i",
            minDate: "today",
            time_24hr: true,
            onChange: function (selectedDates, dateStr, instance) {
                // When start date updates, set end date's minDate to the start date
                // This prevents selecting an end date before the start date
                endDatePicker.set('minDate', dateStr);
            }
        });

        const endDatePicker = flatpickr("#endDate", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            altInput: true,
            altFormat: "d/m/Y H:i",
            minDate: "today",
            time_24hr: true
        });
    }
});

async function loadMessMenu() {
    const tbody = document.querySelector('#mess-menu-table tbody');
    try {
        // Fetch from API (simulated for now if API not ready, but we made it)
        const res = await fetch(`${API_BASE}/hostel/mess`);
        if (!res.ok) throw new Error('Failed to load menu');

        const menu = await res.json();

        if (menu.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Menu not uploaded yet.</td></tr>';
            return;
        }

        // Sort by Day (Mon-Sun)
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        menu.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        tbody.innerHTML = menu.map(m => `
            <tr class="${m.day === today ? 'today-row' : ''}">
                <td>${m.day}</td>
                <td>${m.breakfast}</td>
                <td>${m.lunch}</td>
                <td>${m.snacks}</td>
                <td>${m.dinner}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Error loading menu.</td></tr>';
    }
}

async function handleLeaveSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('type').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reason = document.getElementById('reason').value;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('Please login to apply for leave.');
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const res = await fetch(`${API_BASE}/hostel/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ type, startDate, endDate, reason })
        });

        if (res.ok) {
            alert('Leave Application Submitted!');
            document.getElementById('leaveForm').reset();
            loadMyLeaves();
        } else {
            alert('Failed to submit application.');
        }
    } catch (error) {
        console.error(error);
        alert('Error submitting leave.');
    }
}

async function loadMyLeaves() {
    const container = document.getElementById('leave-history');
    const statusBadge = document.getElementById('leave-status-count');

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
        const res = await fetch(`${API_BASE}/hostel/my-leaves`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const leaves = await res.json();

        if (statusBadge) statusBadge.innerText = `${leaves.length} Applications`;

        if (leaves.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#64748b;">No history.</p>';
            return;
        }

        container.innerHTML = leaves.map(l => `
            <div style="background:#f8fafc; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color:#334155; font-size:0.9rem;">${l.type}</strong>
                    <div style="font-size:0.75rem; color:#64748b;">${new Date(l.startDate).toLocaleDateString()}</div>
                </div>
                <span style="font-size:0.75rem; padding:2px 8px; border-radius:10px; background:${getStatusColor(l.status)}; color:white;">
                    ${l.status}
                </span>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
    }
}

function getStatusColor(status) {
    if (status === 'Approved') return '#10b981'; // Green
    if (status.includes('Rejected')) return '#ef4444'; // Red
    return '#f59e0b'; // Amber (Pending / Approved by HOD)
}

async function loadHostelNotices() {
    // Reusing existing valid notices logic or new hostel specific?
    // Let's assume notices API has a filter or we fetch all and filter client side for 'hosteler' audience
    // Or utilize the recently created filtered API.
    // For simplicity, I'll fetch generic notices for now or update Notice Controller to return 'hosteler' notices publicly or protected.
    // Let's mock or use the standard notice loader if available.
    // I'll leave this placeholder logic.
    const list = document.getElementById('hostel-notices-list');
    if (!list) return;

    list.innerHTML = `
        <div class="notice-card-item">
            <div class="notice-icon-box"><i class="fa-solid fa-bullhorn"></i></div>
            <div class="notice-content">
                <h4>Mess Timing Change</h4>
                <p>Dinner will be served at 7:30 PM from tomorrow.</p>
                <div class="notice-date-badge">Today</div>
            </div>
        </div>
    `;
}
