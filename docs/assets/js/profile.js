
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
            // alert('Profile Picture Updated!'); 
            // Update LocalStorage user object if we want to persist avatar there too, 
            // but for now profile page fetches fresh data always.

        } catch (error) {
            console.error(error);
            alert(`Upload Failed: ${error.message}`);
            // Revert preview? For now simple error alert is fine.
        }
    });
});

function renderProfile(user) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('profileContent').style.display = 'grid';

    // Sidebar
    document.getElementById('p-name').textContent = user.name;
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

    // document.getElementById('p-email').textContent = user.email; // Removed old specific IDs logic for sidebar to use generic container approach or ensure HTML matches.
    // Actually, let's just replace the existing hardcoded HTML in profile.html with a container or clear it.
    // Since I can't easily change profile.html structure in this tool call without a second modify, I will target the div that contains these rows.
    // In profile.html I see: <div style="margin-top: 2rem; ..."> containing .info-row. 
    // I should give that div an ID in profile.html first or select it smartly.


    const roleElem = document.getElementById('p-role-badge');
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

    // Avatar Logic
    const avatarImg = document.getElementById('p-avatar');
    if (user.profilePicture) {
        // Handle full URL or relative path
        const src = user.profilePicture.startsWith('http')
            ? user.profilePicture
            : `http://localhost:5000${user.profilePicture}`;
        avatarImg.src = src;
    } else {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${color.replace('#', '')}&color=fff&size=256&bold=true`;
    }

    // Grids
    const academic = document.getElementById('academic-grid');

    // Clear previous content if any (safeguard)
    academic.innerHTML = '';

    const addItem = (label, value, grid, iconClass, delayIndex) => {
        if (!value) return;
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

        let sem = '1st';
        if (user.batch === '2023') sem = '5th';
        if (user.batch === '2024') sem = '3rd';
        if (user.batch === '2025') sem = '1st';
        addItem('Semester', sem, academic, 'fa-solid fa-book-open', count++);

        addItem('Hostel', user.hostelName, academic, 'fa-solid fa-hotel', count++);
        addItem('Room No', user.roomNumber, academic, 'fa-solid fa-door-closed', count++);
    } else if (user.role === 'teacher') {
        // Employee ID & Dept are in Sidebar now
        addItem('Designation', user.designation, academic, 'fa-solid fa-briefcase', count++);
        addItem('Experience', `${user.yearsExperience || 0} Years`, academic, 'fa-solid fa-chart-line', count++);
        addItem('Specialization', user.specialization, academic, 'fa-solid fa-microchip', count++);
    }

    // Common Stats for Everyone (to fill space)
    const joinYear = user.joiningYear || (user.createdAt ? new Date(user.createdAt).getFullYear() : '2024');
    addItem('Member Since', joinYear, academic, 'fa-regular fa-calendar-check', count++);

    // Account ID not really needed in detailed view for normal users, so omitting from grid.
}
