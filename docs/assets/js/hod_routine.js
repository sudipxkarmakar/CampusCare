const API_URL = 'http://localhost:5000/api';
// HOD Routine Management Logic

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadRoutineTableStructure();

    // Event listener for modal close buttons
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.onclick = () => {
            const modalId = btn.dataset.modal;
            document.getElementById(modalId).style.display = 'none';
        };
    });
});

const timeSlots = [
    "09:30 - 10:30", "10:30 - 11:30", "11:30 - 12:30", "12:30 - 01:30",
    "01:30 - 02:30", // Replaced Break with regular slot
    "02:30 - 03:30", "03:30 - 04:30", "04:30 - 05:30"
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// State
let allSubjects = [];
let allTeachers = [];

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

            // "Break" logic removed as requested (now just standard slots)
            td.dataset.day = day;
            td.dataset.slot = slot;
            td.id = `cell-${day}-${index}`;
            td.innerHTML = `<span style="color:#cbd5e1; font-size:0.8rem;">Free</span>`;

            // Click to edit
            td.onclick = () => openEditModal(day, slot);

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

async function loadRoutine() {
    const year = document.getElementById('routineYear').value;
    let batch = document.getElementById('routineBatch').value;
    if (batch && /^\d+$/.test(batch)) {
        batch = `Batch ${batch}`;
    }

    if (!year || !batch) return;

    // Load metadata if not loaded
    if (allSubjects.length === 0) await loadMetadata();

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/routine/student?year=${year}&batch=${batch}&department=${user.department}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch routine');

        const routineData = await response.json();

        // Clear previous data visually (reset to 'Free')
        document.querySelectorAll('.routine-cell').forEach(cell => {
            if (!cell.innerText.includes('LUNCH')) {
                cell.innerHTML = `<span style="color:#cbd5e1; font-size:0.8rem;">Free</span>`;
                cell.classList.remove('has-class'); // helper class if needed
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
        alert('Error loading routine');
    }
}

async function loadMetadata() {
    const user = JSON.parse(localStorage.getItem('user'));

    // Load Subjects
    try {
        const resSub = await fetch(`${API_URL}/subjects?dept=${user.department}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (resSub.ok) allSubjects = await resSub.json();
    } catch (e) { console.error("Failed to load subjects", e); }

    // Load Teachers
    try {
        const resTeach = await fetch(`${API_URL}/hod/teachers`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (resTeach.ok) allTeachers = await resTeach.json();
    } catch (e) { console.error("Failed to load teachers", e); }
}

// --- MODAL & EDITING ---

async function openEditModal(day, slot) {
    const year = document.getElementById('routineYear').value;
    const batch = document.getElementById('routineBatch').value;

    if (!year || !batch) {
        alert("Please select Year and Batch first.");
        return;
    }

    document.getElementById('editDay').value = day;
    document.getElementById('editTimeSlot').value = slot;
    document.getElementById('slotInfoDisplay').innerText = `Editing: ${day} @ ${slot} for ${year} Batch ${batch}`;

    // Explicitly Center Modal (Logic Fix)
    const modal = document.getElementById('editSlotModal');
    modal.style.display = 'flex'; // Use Flex to center
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    // Additional styling via JS to ensure it overrides or complements CSS
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.background = 'white';
        modalContent.style.borderRadius = '12px';
        modalContent.style.padding = '2rem';
        modalContent.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        modalContent.style.border = '1px solid #e2e8f0';
        modalContent.style.maxWidth = '450px';
        modalContent.style.width = '100%';
    }

    // Populate Selects (Filtered)
    const subSelect = document.getElementById('editSubject');
    subSelect.innerHTML = '<option value="">Loading...</option>';

    const user = JSON.parse(localStorage.getItem('user'));

    try {
        // Fetch Subjects specific to this Year and Department
        const res = await fetch(`${API_URL}/subjects?dept=${user.department}&year=${year}`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (res.ok) {
            const subjects = await res.json();
            subSelect.innerHTML = '<option value="">Select Subject</option>';
            if (subjects.length === 0) {
                const opt = document.createElement('option');
                opt.disabled = true;
                opt.text = "No subjects found for this year";
                subSelect.appendChild(opt);
            }
            subjects.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s._id;
                opt.textContent = `${s.name} (${s.code})`;
                subSelect.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Error fetching filtered subjects", e);
        subSelect.innerHTML = '<option value="">Error loading subjects</option>';
    }

    // Populate Teachers - REMOVED (Auto-assigned by backend based on subject)
    // populateTeacherSelect(allTeachers); 

    // document.getElementById('editRoom').value = ''; // REMOVED (Field removed)
}

function filterTeachersBySubject() {
    // Optional: Filter logic if we had expertise mapping in frontend
    // For now, keep showing all teachers or implement simple filter
}

async function handleSlotSave(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));

    const year = document.getElementById('routineYear').value;
    const batch = document.getElementById('routineBatch').value;

    const data = {
        day: document.getElementById('editDay').value,
        timeSlot: document.getElementById('editTimeSlot').value,
        year: year,
        department: user.department,
        batch: batch.match(/^\d+$/) ? `Batch ${batch}` : batch,
        subjectId: document.getElementById('editSubject').value,
        // teacherId: Auto-assigned by backend
        // room: Removed from UI
    };

    try {
        const res = await fetch(`${API_URL}/routine`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok) {
            document.getElementById('editSlotModal').style.display = 'none';
            loadRoutine(); // Refresh grid
        } else {
            alert('Error: ' + (result.message || 'Failed to save slot'));
        }
    } catch (err) {
        console.error(err);
        alert('Server Error');
    }
}

async function handleSlotDelete() {
    if (!confirm("Are you sure you want to clear this slot?")) return;

    const user = JSON.parse(localStorage.getItem('user'));

    const data = {
        day: document.getElementById('editDay').value,
        timeSlot: document.getElementById('editTimeSlot').value,
        year: document.getElementById('routineYear').value,
        batch: document.getElementById('routineBatch').value.match(/^\d+$/) ? `Batch ${document.getElementById('routineBatch').value}` : document.getElementById('routineBatch').value,
        department: user.department
    };

    try {
        const res = await fetch(`${API_URL}/routine`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            document.getElementById('editSlotModal').style.display = 'none';
            loadRoutine();
        } else {
            const result = await res.json();
            alert('Error: ' + result.message);
        }
    } catch (err) {
        console.error(err);
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
