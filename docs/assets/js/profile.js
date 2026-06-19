
document.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html'; // Fallback
        return;
    }
    const token = JSON.parse(userStr).token;

    // Dynamic Dashboard link and Title localization
    try {
        const user = JSON.parse(userStr);
        const role = (user.role || '').toLowerCase();
        
        // 1. Dynamic routing for dashboard button
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            let dashPath = 'index.html';
            if (role === 'student') dashPath = 'student/index.html';
            else if (role === 'teacher') dashPath = 'teacher/index.html';
            else if (role === 'hod') dashPath = 'hod/index.html';
            else if (role === 'dean') dashPath = 'dean/index.html';
            else if (role === 'principal') dashPath = 'principal/index.html';
            else if (role === 'warden') dashPath = 'warden/index.html';
            else if (role === 'hosteler') dashPath = 'student/index.html';
            
            backBtn.href = dashPath;
            backBtn.innerHTML = `<i class="fa-solid fa-house"></i> Dashboard`;
        }
    } catch (e) {
        console.error('Failed to localize profile elements:', e);
    }

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === "" || window.location.protocol === 'file:';
    const API_BASE = (isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');

    // Load Profile
    try {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Profile fetch status:', res.status);

        if (!res.ok) throw new Error('Failed to load profile');
        const user = await res.json();
        
        // Sync with localStorage so edit modal gets fresh data
        const localUserStr = localStorage.getItem('user');
        if (localUserStr) {
            const localUser = JSON.parse(localUserStr);
            const token = localUser.token;
            localStorage.setItem('user', JSON.stringify({ ...user, token }));
        }

        renderProfile(user);

    } catch (error) {
        document.getElementById('loading').innerHTML = `<p style="color:#ef4444; font-size:1.2rem;">Error: ${error.message}</p>`;
    }

    // Avatar Crop and Upload Logic
    const avatarInput = document.getElementById('avatarInput');
    const cropModal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    const saveCropBtn = document.getElementById('saveCropBtn');
    let activeCropper = null;

    // Zoom/Rotation controls setup
    document.getElementById('zoomInBtn').addEventListener('click', () => activeCropper && activeCropper.zoom(0.1));
    document.getElementById('zoomOutBtn').addEventListener('click', () => activeCropper && activeCropper.zoom(-0.1));
    document.getElementById('rotateLeftBtn').addEventListener('click', () => activeCropper && activeCropper.rotate(-45));
    document.getElementById('rotateRightBtn').addEventListener('click', () => activeCropper && activeCropper.rotate(45));

    // Global helper to close crop modal safely
    window.closeCropModal = function () {
        cropModal.style.display = 'none';
        if (activeCropper) {
            activeCropper.destroy();
            activeCropper = null;
        }
        avatarInput.value = '';
    };

    // Close modal on background click
    window.addEventListener('click', (e) => {
        if (e.target === cropModal) {
            closeCropModal();
        }
    });

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            cropImage.src = event.target.result;
            cropModal.style.display = 'flex';

            if (activeCropper) {
                activeCropper.destroy();
            }

            activeCropper = new Cropper(cropImage, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                background: false,
                responsive: true,
                autoCropArea: 0.8
            });
        };
        reader.readAsDataURL(file);
    });

    saveCropBtn.addEventListener('click', async () => {
        if (!activeCropper) return;

        saveCropBtn.innerText = 'Uploading...';
        saveCropBtn.disabled = true;

        const canvas = activeCropper.getCroppedCanvas({
            width: 400,
            height: 400
        });

        canvas.toBlob(async (blob) => {
            if (!blob) {
                alert('Could not crop image');
                saveCropBtn.innerText = 'Crop & Save';
                saveCropBtn.disabled = false;
                return;
            }

            const formData = new FormData();
            formData.append('profileImage', blob, 'avatar.jpg');

            try {
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === "" || window.location.protocol === 'file:';
                const API_BASE = (isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');
                const res = await fetch(`${API_BASE}/api/auth/profile-picture`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
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

                // Update profile avatar image immediately
                const src = data.profilePicture.startsWith('http')
                    ? data.profilePicture
                    : `${API_BASE}${data.profilePicture}`;
                document.getElementById('p-avatar').src = src + `?t=${new Date().getTime()}`;

                alert('Profile Picture Updated!');
                closeCropModal();

            } catch (error) {
                console.error(error);
                alert(`Upload Failed: ${error.message}`);
            } finally {
                saveCropBtn.innerText = 'Crop & Save';
                saveCropBtn.disabled = false;
            }
        }, 'image/jpeg');
    });
});

function renderProfile(user) {
    try {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('profileContent').style.display = 'grid';

        // Sidebar
        const pName = document.getElementById('p-name');
        if (pName) pName.textContent = user.name;

        // Render About Me / Bio in Sidebar
        const pBioText = document.getElementById('p-bio-text');
        if (pBioText) {
            pBioText.textContent = user.about || "No bio added yet. Click edit to write something about yourself!";
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
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === "" || window.location.protocol === 'file:';
                const API_BASE = (isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');
                const src = user.profilePicture.startsWith('http')
                    ? user.profilePicture
                    : `${API_BASE}${user.profilePicture}`;
                avatarImg.src = src;
            } else {
                let colorBase = '4f46e5';
                if (user.role === 'student') colorBase = '2563eb';
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${colorBase}&color=fff&size=256&bold=true`;
            }
        }

        // Grids
        const personalGrid = document.getElementById('personal-grid');
        const academicGrid = document.getElementById('academic-grid');
        if (personalGrid) personalGrid.innerHTML = '';
        if (academicGrid) academicGrid.innerHTML = '';

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

        let personalCount = 0;
        let academicCount = 0;

        // 1. Populate Personal Details Grid
        const joinYear = user.joiningYear || (user.createdAt ? new Date(user.createdAt).getFullYear() : '2024');
        addItem('Email Address', user.email, personalGrid, 'fa-regular fa-envelope', personalCount++);
        addItem('Contact Number', user.contactNumber || 'Not Provided', personalGrid, 'fa-solid fa-phone', personalCount++);
        addItem('Blood Group', user.bloodGroup || 'Not Provided', personalGrid, 'fa-solid fa-droplet', personalCount++);
        addItem('Member Since', joinYear, personalGrid, 'fa-regular fa-calendar-check', personalCount++);

        // 2. Adjust Card Title and Icon based on role
        const detailsTitle = document.getElementById('details-section-title');
        const detailsIcon = document.getElementById('details-section-icon');
        const isStaff = ['teacher', 'hod', 'dean', 'principal', 'warden', 'admin'].includes(user.role);
        
        if (isStaff) {
            if (detailsTitle) detailsTitle.textContent = 'Professional Details';
            if (detailsIcon) detailsIcon.innerHTML = '<i class="fa-solid fa-briefcase"></i>';
        } else {
            if (detailsTitle) detailsTitle.textContent = 'Academic Details';
            if (detailsIcon) detailsIcon.innerHTML = '<i class="fa-solid fa-graduation-cap"></i>';
        }

        // 3. Populate Academic / Professional Details Grid
        if (user.role === 'student' || user.role === 'hosteler') {
            addItem('Roll Number', user.rollNumber || 'N/A', academicGrid, 'fa-regular fa-id-badge', academicCount++);
            addItem('Department', user.department || 'General', academicGrid, 'fa-solid fa-building-user', academicCount++);
            addItem('Batch', user.batch, academicGrid, 'fa-solid fa-layer-group', academicCount++);
            addItem('Section', user.section || 'N/A', academicGrid, 'fa-solid fa-people-group', academicCount++);

            let sem = 'N/A';
            if (user.semester) {
                const s = String(user.semester);
                const last = s.slice(-1);
                const suffix = (last === '1' && s !== '11') ? 'st' : (last === '2' && s !== '12') ? 'nd' : (last === '3' && s !== '13') ? 'rd' : 'th';
                sem = `${s}${suffix}`;
            }
            addItem('Semester', sem, academicGrid, 'fa-solid fa-book-open', academicCount++);

            addItem('Hostel', user.hostelName, academicGrid, 'fa-solid fa-hotel', academicCount++);
            addItem('Room No', user.roomNumber, academicGrid, 'fa-solid fa-door-closed', academicCount++);
            
            // Add missing student academic stats
            addItem('CGPA', user.cgpa ? user.cgpa.toFixed(2) : 'Not Specified', academicGrid, 'fa-solid fa-chart-line', academicCount++);
            addItem('Attendance', user.attendance !== undefined && user.attendance !== null ? user.attendance + '%' : 'Not Specified', academicGrid, 'fa-solid fa-clipboard-user', academicCount++);
            addItem('Mentor', user.mentor ? user.mentor.name : 'Not Assigned', academicGrid, 'fa-solid fa-user-tie', academicCount++);
            addItem('Enrolled Subjects', user.subjects && user.subjects.length > 0 ? user.subjects.join(', ') : 'None Enrolled', academicGrid, 'fa-solid fa-book', academicCount++);
        } else if (isStaff) {
            let defaultDesignation = 'Faculty';
            if (user.role === 'hod') defaultDesignation = 'Head of Department';
            else if (user.role === 'dean') defaultDesignation = 'Dean';
            else if (user.role === 'principal') defaultDesignation = 'Principal';
            else if (user.role === 'warden') defaultDesignation = 'Hostel Warden';
            else if (user.role === 'admin') defaultDesignation = 'Administrator';

            addItem('Employee ID', user.employeeId || user.rollNumber || 'N/A', academicGrid, 'fa-regular fa-id-badge', academicCount++);
            addItem('Designation', user.designation || defaultDesignation, academicGrid, 'fa-solid fa-briefcase', academicCount++);
            addItem('Department', user.department || 'General', academicGrid, 'fa-solid fa-building-user', academicCount++);
            
            let exp = '0 Years';
            if (user.yearsExperience !== undefined && user.yearsExperience !== null) {
                exp = `${user.yearsExperience} Years`;
            }
            addItem('Experience', exp, academicGrid, 'fa-solid fa-chart-line', academicCount++);
            addItem('Specialization', user.specialization || 'Not Specified', academicGrid, 'fa-solid fa-microchip', academicCount++);

            // Add missing faculty/staff professional details
            addItem('Teaching Subjects', user.teachingSubjects && user.teachingSubjects.length > 0 ? user.teachingSubjects.join(', ') : 'None Assigned', academicGrid, 'fa-solid fa-book', academicCount++);
            addItem('Teaching Batches', user.teachingBatches && user.teachingBatches.length > 0 ? user.teachingBatches.map(b => b.batch ? `${b.batch} (${b.passOutYear})` : b).join(', ') : 'None Assigned', academicGrid, 'fa-solid fa-users', academicCount++);
            addItem('Expertise Areas', user.expertise && user.expertise.length > 0 ? user.expertise.join(', ') : 'Not Specified', academicGrid, 'fa-solid fa-award', academicCount++);
            if (user.weeklyLoad) {
                addItem('Weekly Workload', user.weeklyLoad + ' Hours', academicGrid, 'fa-solid fa-clock', academicCount++);
            }
        }

        // --- MAR / MOOCs Section (Student Only) ---
        if (user.role === 'student') {
            fetchMarMoocs(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : '', academicGrid, academicCount);
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
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === "" || window.location.protocol === 'file:';
        const API_BASE = (isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');
        const res = await fetch(`${API_BASE}/api/mar-moocs`, {
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
    setVal('editContact', user.contactNumber);
    setVal('editBloodGroup', user.bloodGroup);
    setVal('editAbout', user.about);

    const isStaff = ['teacher', 'hod', 'dean', 'principal', 'warden', 'admin'].includes(user.role);
    const studentGroup = document.getElementById('student-fields-group');
    const staffGroup = document.getElementById('staff-fields-group');

    if (isStaff) {
        if (studentGroup) studentGroup.style.display = 'none';
        if (staffGroup) staffGroup.style.display = 'flex';

        setVal('editEmpId', user.employeeId || user.rollNumber);
        setVal('editStaffDept', user.department);
        setVal('editDesignation', user.designation);
        setVal('editExperience', user.yearsExperience);
        setVal('editSpecialization', user.specialization);
        setVal('editExpertise', user.expertise && user.expertise.length > 0 ? user.expertise.join(', ') : '');
    } else {
        if (staffGroup) staffGroup.style.display = 'none';
        if (studentGroup) studentGroup.style.display = 'flex';

        setVal('editRoll', user.rollNumber);
        setVal('editDept', user.department);
        setVal('editBatch', user.batch);
        setVal('editSection', user.section);
        setVal('editHostelName', user.hostelName);
        setVal('editRoomNumber', user.roomNumber);
    }

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

        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const oldUser = JSON.parse(userStr);
        const token = oldUser.token;
        const isStaff = ['teacher', 'hod', 'dean', 'principal', 'warden', 'admin'].includes(oldUser.role);

        // payload construction
        let payload = {
            name: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            contactNumber: document.getElementById('editContact').value,
            bloodGroup: document.getElementById('editBloodGroup').value,
            about: document.getElementById('editAbout').value
        };

        if (isStaff) {
            payload.employeeId = document.getElementById('editEmpId').value;
            payload.department = document.getElementById('editStaffDept').value;
            payload.designation = document.getElementById('editDesignation').value;
            payload.yearsExperience = document.getElementById('editExperience').value ? parseInt(document.getElementById('editExperience').value) : 0;
            payload.specialization = document.getElementById('editSpecialization').value;
            payload.expertise = document.getElementById('editExpertise').value;
        } else {
            payload.rollNumber = document.getElementById('editRoll').value;
            payload.department = document.getElementById('editDept').value;
            payload.batch = document.getElementById('editBatch').value;
            payload.section = document.getElementById('editSection').value;
            payload.hostelName = document.getElementById('editHostelName').value;
            payload.roomNumber = document.getElementById('editRoomNumber').value;
        }

        const submitBtn = editForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Saving...';
        submitBtn.disabled = true;

        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === "" || window.location.protocol === 'file:';
            const API_BASE = (isLocal ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');
            const res = await fetch(`${API_BASE}/api/auth/profile`, {
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
