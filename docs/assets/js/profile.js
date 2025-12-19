
document.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html'; // Fallback
        return;
    }
    const token = JSON.parse(userStr).token;

    // Load Profile
    try {
        const res = await fetch('http://localhost:5000/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Profile fetch status:', res.status);

        if (!res.ok) throw new Error('Failed to load profile');
        const user = await res.json();
        renderProfile(user);

    } catch (error) {
        document.getElementById('loading').innerHTML = `<p style="color:#ef4444; font-size:1.2rem;">Error: ${error.message}</p>`;
    }

    // Avatar Upload Logic
    const avatarInput = document.getElementById('avatarInput');
    avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview immediately (Optimistic UI)
        const reader = new FileReader();
        reader.onload = (e) => document.getElementById('p-avatar').src = e.target.result;
        reader.readAsDataURL(file);

        // Upload
        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const res = await fetch('http://localhost:5000/api/auth/profile-picture', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // No Content-Type for FormData
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Upload failed');
            }

            const data = await res.json();
            console.log('Upload success:', data);

            // Update LocalStorage to reflect in header immediately
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                userObj.profilePicture = data.profilePicture;
                localStorage.setItem('user', JSON.stringify(userObj));

                // Force header update if checkAuthState is available
                if (window.checkAuthState) window.checkAuthState();
            }
            alert('Profile Picture Updated!');

        } catch (error) {
            console.error(error);
            alert(`Upload Failed: ${error.message}`);
            // Revert preview? For now simple error alert is fine.
        }
    });
});

function renderProfile(user) {
    try {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('profileContent').style.display = 'grid';

        // Sidebar
        const pName = document.getElementById('p-name');
        if (pName) pName.textContent = user.name;

        // Sidebar Content Injection
        const container = document.getElementById('sidebar-info-container');
        if (container) {
            container.innerHTML = `
            <div class="info-row">
                <i class="fa-regular fa-envelope"></i>
                <span>
                    <strong>Email</strong>
                    ${user.email}
                </span>
            </div>
            <div class="info-row">
                <i class="fa-regular fa-id-badge"></i>
                <span>
                    <strong>${user.role === 'teacher' ? 'Employee ID' : 'Roll Number'}</strong>
                    ${user.rollNumber || user.employeeId || 'N/A'}
                </span>
            </div>
            <div class="info-row">
                <i class="fa-solid fa-building-user"></i>
                <span>
                    <strong>Department</strong>
                    ${user.department || 'General'}
                </span>
            </div>
            <div class="info-row">
                <i class="fa-solid fa-droplet"></i>
                <span>
                    <strong>Blood Group</strong>
                    ${user.bloodGroup || 'Not Provided'}
                </span>
            </div>
            <div class="info-row">
                <i class="fa-solid fa-phone"></i>
                <span>
                    <strong>Contact</strong>
                    ${user.contactNumber || 'N/A'}
                </span>
            </div>
            `;
        }

        const roleElem = document.getElementById('p-role-badge');
        if (roleElem) {
            roleElem.textContent = user.role.toUpperCase();

            // Theme Colors
            let color = '#4f46e5';
            let bg = 'rgba(79, 70, 229, 0.1)';
            let border = 'rgba(79, 70, 229, 0.2)';

            if (user.role === 'student') { color = '#2563eb'; bg = 'rgba(37, 99, 235, 0.1)'; }
            if (user.role === 'hosteler') { color = '#d97706'; bg = 'rgba(217, 119, 6, 0.1)'; }
            if (user.role === 'teacher') { color = '#059669'; bg = 'rgba(5, 150, 105, 0.1)'; }

            roleElem.style.color = color;
            roleElem.style.background = bg;
            roleElem.style.border = `1px solid ${border}`;
        }

        // Avatar Logic
        const avatarImg = document.getElementById('p-avatar');
        if (avatarImg) {
            if (user.profilePicture) {
                // Handle full URL or relative path
                const src = user.profilePicture.startsWith('http')
                    ? user.profilePicture
                    : `http://localhost:5000${user.profilePicture}`;
                avatarImg.src = src;
            } else {
                let colorBase = '4f46e5';
                if (user.role === 'student') colorBase = '2563eb';
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${colorBase}&color=fff&size=256&bold=true`;
            }
        }

        // Grids
        const academic = document.getElementById('academic-grid');
        // Clear previous content if any (safeguard)
        if (academic) academic.innerHTML = '';

        const addItem = (label, value, grid, iconClass, delayIndex) => {
            if (!value || !grid) return;
            const div = document.createElement('div');
            div.className = 'detail-card';
            div.style.animationDelay = `${delayIndex * 0.1}s`;
            div.innerHTML = `
                <div class="detail-icon-box"><i class="${iconClass}"></i></div>
                <div class="detail-content">
                    <span class="detail-label">${label}</span>
                    <span class="detail-value">${value}</span>
                </div>
            `;
            grid.appendChild(div);
        };

        let count = 0;

        // Role Specific Fields
        if (user.role === 'student' || user.role === 'hosteler') {
            // Roll & Dept are in Sidebar now
            addItem('Batch', user.batch, academic, 'fa-solid fa-layer-group', count++);
            addItem('Section', user.section || 'N/A', academic, 'fa-solid fa-people-group', count++); // Fallback for section

            // Use real semester from DB, fallback to 'N/A' or calculated if needed
            let sem = user.semester ? (user.semester + (['1', '2', '3'].includes(String(user.semester).split('').pop()) ? ['st', 'nd', 'rd'][String(user.semester).split('').pop() - 1] : 'th')) : 'N/A';

            // Or simpler: just show the number if that's what is stored, or append suffix
            // The DB has integer 7. So "7th".
            if (user.semester) {
                const s = String(user.semester);
                const last = s.slice(-1);
                const suffix = (last === '1' && s !== '11') ? 'st' : (last === '2' && s !== '12') ? 'nd' : (last === '3' && s !== '13') ? 'rd' : 'th';
                sem = `${s}${suffix}`;
            }

            addItem('Semester', sem, academic, 'fa-solid fa-book-open', count++);

            addItem('Hostel', user.hostelName, academic, 'fa-solid fa-hotel', count++);
            addItem('Room No', user.roomNumber, academic, 'fa-solid fa-door-closed', count++);
        } else if (user.role === 'teacher') {
            addItem('Designation', user.designation, academic, 'fa-solid fa-briefcase', count++);
            addItem('Experience', `${user.yearsExperience || 0} Years`, academic, 'fa-solid fa-chart-line', count++);
            addItem('Specialization', user.specialization, academic, 'fa-solid fa-microchip', count++);
        }

        // Common Stats for Everyone
        const joinYear = user.joiningYear || (user.createdAt ? new Date(user.createdAt).getFullYear() : '2024');
        addItem('Member Since', joinYear, academic, 'fa-regular fa-calendar-check', count++);

        // --- MAR / MOOCs Section (Student Only) ---
        if (user.role === 'student') {
            fetchMarMoocs(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : '', academic, count);
        } else {
            const actContainer = document.getElementById('activity-log-container');
            if (actContainer) actContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:1rem;">Not applicable for this role.</p>';

            const actHeader = document.querySelector('.section-header[style*="margin-top: 3rem;"]');
            if (actHeader) actHeader.style.display = 'none';
        }
    } catch (err) {
        console.error('Render Profile Error:', err);
        alert('Error rendering profile: ' + err.message);
    }
}


async function fetchMarMoocs(token, grid, count) {
    try {
        console.log('Fetching MAR/MOOCs...');
        const res = await fetch('http://localhost:5000/api/mar-moocs', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('MAR/MOOC fetch status:', res.status);

        if (res.status === 401) throw new Error('Unauthorized');
        if (res.status === 403) throw new Error('Forbidden');
        if (!res.ok) throw new Error(`Server Error: ${res.status}`);

        const data = await res.json();

        // 1. Add Totals to Academic Grid
        const addItem = (label, value, grid, iconClass, delayIndex) => {
            const div = document.createElement('div');
            div.className = 'detail-card';
            div.style.animationDelay = `${delayIndex * 0.1}s`;
            div.innerHTML = `
                <div class="detail-icon-box"><i class="${iconClass}"></i></div>
                <div class="detail-content">
                    <span class="detail-label">${label}</span>
                    <span class="detail-value">${value}</span>
                </div>
            `;
            grid.appendChild(div);
        };

        addItem('MAR Points', data.totals.mar || 0, grid, 'fa-solid fa-star', count++);
        addItem('MOOC Credits', data.totals.mooc || 0, grid, 'fa-solid fa-certificate', count++);

        // 2. Render Activity Log
        const logContainer = document.getElementById('activity-log-container');
        logContainer.innerHTML = ''; // Clear loading

        if (data.records.length === 0) {
            logContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:1rem;">No activities recorded yet.</p>';
            return;
        }

        data.records.forEach((record, index) => {
            const div = document.createElement('div');
            div.className = 'detail-card';
            // Different styling for list items (wide)
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '20px';
            div.style.animationDelay = `${index * 0.05}s`;

            const icon = record.category === 'mar' ? 'fa-star' : 'fa-certificate';
            const colorClass = record.category === 'mar' ? 'text-warning' : 'text-primary'; // Using utility classes if available or inline
            const iconColor = record.category === 'mar' ? '#f59e0b' : '#3b82f6';

            const statusColors = {
                'Proposed': '#9ca3af',
                'Ongoing': '#3b82f6',
                'Completed': '#10b981',
                'Verified': '#059669'
            };
            const statusColor = statusColors[record.status] || '#94a3b8';

            div.innerHTML = `
                <div class="detail-icon-box" style="color: ${iconColor}; background: ${iconColor}20;">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="detail-content" style="flex: 1;">
                    <span class="detail-label" style="display:flex; justify-content:space-between;">
                        ${record.category.toUpperCase()}
                        <span style="color:${statusColor}; font-weight:600; font-size:0.75rem;">${record.status.toUpperCase()}</span>
                    </span>
                    <span class="detail-value" style="font-size:1.1rem;">${record.title}</span>
                    <div style="font-size:0.85rem; color:#64748b; margin-top:4px;">
                        ${record.platform ? `<i class="fa-solid fa-layer-group"></i> ${record.platform}` : ''}
                        &nbsp;&nbsp;
                        ${record.completionDate ? `<i class="fa-regular fa-calendar"></i> ${new Date(record.completionDate).toLocaleDateString()}` : ''}
                    </div>
                </div>
                <div style="text-align:right; min-width:60px;">
                    <span style="font-size:1.2rem; font-weight:700; color:${iconColor};">${record.points}</span>
                    <span style="font-size:0.7rem; display:block; color:#94a3b8;">PTS</span>
                </div>
            `;
            logContainer.appendChild(div);
        });

    } catch (error) {
        console.error('MAR/MOOC Error:', error);
        document.getElementById('activity-log-container').innerHTML = `
            <div style="text-align:center; padding:2rem;">
                <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444; font-size:2rem; margin-bottom:1rem;"></i>
                <p style="color:#64748b; margin-bottom:0.5rem;">Failed to load activities.</p>
                <code style="display:block; font-size:0.8rem; background:#f1f5f9; padding:0.5rem; border-radius:4px; color:#ef4444;">${error.message}</code>
            </div>
        `;
    }
}

// --- Edit Profile Logic ---

// --- Edit Profile Logic ---

const modal = document.getElementById('editProfileModal');
const editForm = document.getElementById('editProfileForm');

function openEditModal() {
    if (!modal) return;

    // Get current user data from LocalStorage (Source of Truth)
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    // Populate Form Fields
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('editName', user.name);
    setVal('editEmail', user.email);
    setVal('editRoll', user.rollNumber || user.employeeId);
    setVal('editDept', user.department);
    setVal('editBatch', user.batch);
    setVal('editSection', user.section);
    setVal('editContact', user.contactNumber);
    setVal('editBloodGroup', user.bloodGroup);
    setVal('editAbout', user.about);

    modal.style.display = 'flex';
}

function closeEditModal() {
    if (modal) modal.style.display = 'none';
}

window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;

// Close on outside click
window.onclick = function (event) {
    if (event.target == modal) {
        closeEditModal();
    }
}

// Handle Form Submit
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // payload construction
        const payload = {
            name: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            rollNumber: document.getElementById('editRoll').value,
            department: document.getElementById('editDept').value,
            batch: document.getElementById('editBatch').value,
            section: document.getElementById('editSection').value,
            contactNumber: document.getElementById('editContact').value,
            bloodGroup: document.getElementById('editBloodGroup').value,
            about: document.getElementById('editAbout').value
        };

        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const oldUser = JSON.parse(userStr);
        const token = oldUser.token;

        const submitBtn = editForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Saving...';
        submitBtn.disabled = true;

        try {
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Update failed');
            }

            const updatedUser = await res.json();

            // IMPORTANT: Update LocalStorage with new data while keeping the token
            // The backend might return the full user object, or we merge it.
            // Assuming backend returns the updated user object.
            updatedUser.token = token; // Ensure token is preserved if backend doesn't send it back
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Success!
            alert('Profile Updated Successfully');
            closeEditModal();

            // Refresh to show changes
            window.location.reload();

        } catch (error) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}
