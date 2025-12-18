const API_URL = 'http://localhost:5000/api/hod';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadRoutineTableStructure();
});

const timeSlots = [
    "09:30 - 10:30", "10:30 - 11:30", "11:30 - 12:30", "12:30 - 01:30",
    "Break",
    "02:30 - 03:30", "03:30 - 04:30", "04:30 - 05:30"
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function loadRoutineTableStructure() {
    const tbody = document.getElementById('routineTableBody');
    tbody.innerHTML = '';

    days.forEach(day => {
        const tr = document.createElement('tr');

        // Day Header
        const tdDay = document.createElement('td');
        tdDay.style.fontWeight = '600';
        tdDay.style.color = '#2d3748';
        tdDay.style.background = '#f8fafc';
        tdDay.style.padding = '1rem';
        tdDay.style.border = '1px solid #e2e8f0';
        tdDay.innerText = day;
        tr.appendChild(tdDay);

        timeSlots.forEach((slot, index) => {
            const td = document.createElement('td');
            td.className = 'routine-cell';

            if (slot === 'Break') {
                td.style.background = '#f1f5f9';
                td.innerText = 'LUNCH';
                td.style.verticalAlign = 'middle';
                td.style.color = '#94a3b8';
                td.style.fontWeight = '600';
            } else {
                td.dataset.day = day;
                td.dataset.slot = slot; // Or use index/time
                td.id = `cell-${day}-${index}`;
                td.innerHTML = `<span style="color:#cbd5e1; font-size:0.8rem;">Free</span>`;
            }
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

async function loadRoutine() {
    const year = document.getElementById('routineYear').value;
    const batch = document.getElementById('routineBatch').value;

    if (!year || !batch) return;

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/routine?year=${year}&batch=${batch}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch routine');

        const routineData = await response.json();

        // Clear previous data visually (reset to 'Free')
        document.querySelectorAll('.routine-cell').forEach(cell => {
            if (!cell.innerText.includes('LUNCH')) {
                cell.innerHTML = `<span style="color:#cbd5e1; font-size:0.8rem;">Free</span>`;
            }
        });

        // Populate Data
        routineData.forEach(item => {
            // Find cell
            const cell = Array.from(document.querySelectorAll('.routine-cell')).find(td =>
                td.dataset.day === item.day && td.dataset.slot === item.timeSlot
            );

            if (cell) {
                const subject = item.subjectName || item.subject?.name || 'Subject';
                const teacher = item.teacher?.name || 'Assigned';
                const room = item.room || 'Room TBA';

                cell.innerHTML = `
                    <div class="assigned-box">
                        <div style="font-weight:600; font-size:0.85rem;">${subject}</div>
                        <div style="font-size:0.75rem; margin-top:2px;">${teacher}</div>
                        <div style="font-size:0.7rem; color:#64748b; margin-top:2px;">${room}</div>
                    </div>
                `;
            }
        });

    } catch (error) {
        console.error(error);
        // alert('Error loading routine');
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
