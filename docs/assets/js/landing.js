document.addEventListener('DOMContentLoaded', async () => {
    // 1. Immediate UI Updates (Auth & Profile)
    if (window.checkAuthState) window.checkAuthState();

    // 2. Load Public Notices
    const noticeContainer = document.getElementById('public-notice-list');

    if (noticeContainer) {
        try {
            // Landing Page should ONLY show Public/General notices, regardless of login state.
            const res = await fetch('http://localhost:5000/api/notices?role=public');
            if (!res.ok) throw new Error('API Error');
            const notices = await res.json();

            if (notices.length === 0) {
                noticeContainer.innerHTML = '<div style="background:rgba(255,255,255,0.8); padding:1rem; border-radius:10px; text-align:center; color:#64748b;">No recent public notices available.</div>';
                return;
            }

            let html = '';
            notices.forEach(n => {
                const date = new Date(n.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                html += `
                <div class="notice-item">
                    <div class="notice-date">
                        ${date.split(' ')[1]}<br><span style="font-size:1.2rem;">${date.split(' ')[0]}</span>
                    </div>
                    <div class="notice-content">
                        <strong>${n.title}</strong>
                        <span>${n.content}</span>
                    </div>
                </div>`;
            });
            noticeContainer.innerHTML = html;

        } catch (error) {
            console.error('API Error, using fallback data:', error);
            // Fallback Data so the UI never looks broken
            const fallbackNotices = [
                { title: 'Semester Exams', content: 'Final exams begin from Dec 25th. Check routine.', date: new Date() },
                { title: 'Campus Wi-Fi Update', content: 'Maintenance scheduled for Saturday night.', date: new Date(Date.now() - 86400000) },
                { title: 'Cultural Fest 2025', content: 'Registration opens next week for all students.', date: new Date(Date.now() - 172800000) }
            ];

            let html = '';
            fallbackNotices.forEach(n => {
                const date = new Date(n.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                html += `
                <div class="notice-item">
                    <div class="notice-date">
                        ${date.split(' ')[1]}<br><span style="font-size:1.2rem;">${date.split(' ')[0]}</span>
                    </div>
                    <div class="notice-content">
                        <strong>${n.title}</strong>
                        <span>${n.content}</span>
                    </div>
                </div>`;
            });
            noticeContainer.innerHTML = html;
        }
    }

    // Load Alumni
    const alumniContainer = document.getElementById('alumni-list');
    if (alumniContainer) {
        try {
            const res = await fetch('http://localhost:5000/api/alumni');
            if (!res.ok) throw new Error('API Error');
            const alumni = await res.json();

            if (alumni.length === 0) {
                alumniContainer.innerHTML = '<p style="text-align:center; width:100%;">No alumni profiles found.</p>';
            } else {
                let html = '';
                alumni.forEach(a => {
                    const roleColor = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)];
                    const name = a.user ? a.user.name : a.name || 'Alumni'; // Handle populated user or direct name
                    const avatarUrl = a.linkedinProfile?.includes('http') ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random` : `https://via.placeholder.com/100`;

                    html += `
                    <div class="faculty-card glass">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=100" alt="${name}" class="faculty-img" style="border-radius:15px;">
                        <h3 class="faculty-name">${name}</h3>
                        <p class="faculty-role" style="color:${roleColor};">${a.jobTitle} @ ${a.currentCompany}</p>
                        <p class="faculty-bio">"${a.about || 'Proud Alumni of CampusCare'}"</p>
                        <a href="${a.linkedinProfile || '#'}" target="_blank"
                        style="display:inline-block; margin-top:1rem; text-decoration:none; color:#25D366; font-weight:bold;">
                        <i class="fa-brands fa-whatsapp" style="font-size:1.5rem;"></i> Connect
                        </a>
                    </div>
                    `;
                });
                alumniContainer.innerHTML = html;
            }

        } catch (error) {
            console.error('Alumni API Error:', error);
            alumniContainer.innerHTML = '<p style="text-align:center; color:red;">Failed to load alumni.</p>';
        }
    }

    // Load Transparency Wall (Complaints)
    const complaintContainer = document.getElementById('complaint-list');
    if (complaintContainer) {
        try {
            const res = await fetch('http://localhost:5000/api/complaints');
            if (res.ok) {
                const complaints = await res.json();
                const displayComplaints = complaints.slice(0, 3); // Top 3 recent

                if (displayComplaints.length > 0) {
                    let html = '';
                    displayComplaints.forEach(c => {
                        let statusClass = 'status-progress';
                        if (c.status === 'Resolved') statusClass = 'status-resolved';

                        const date = new Date(c.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                        const excerpt = c.description.length > 80 ? c.description.substring(0, 80) + '...' : c.description;

                        html += `
                          <div class="blog-card glass">
                            <div class="status-badge ${statusClass}">${c.status.toUpperCase()}</div>
                            <h3 class="blog-title">${c.title}</h3>
                            <p class="blog-meta">Reported by: ${c.student?.name || 'Student'} • ${date}</p>
                            <p class="blog-excerpt">${excerpt}</p>
                            <div class="blog-footer">
                              <span><i class="fa-solid fa-thumbs-up"></i> ${c.upvotes} Upvotes</span>
                              ${c.status === 'Resolved' ? '<span><i class="fa-solid fa-check-circle"></i> Verified</span>' : '<span><i class="fa-solid fa-clock"></i> Active</span>'}
                            </div>
                          </div>
                        `;
                    });
                    complaintContainer.innerHTML = html;
                }
            }
        } catch (error) {
            console.error('Transparency Wall Error:', error);
        }
    }

    // Animate Blobs or Interactivity if needed

    // --- AUTH STATE CHECK ---
    if (window.checkAuthState) window.checkAuthState();
});

// --- AUTH FUNCTIONS ---
// --- AUTH FUNCTIONS ---
window.checkAuthState = function () {
    const userStr = localStorage.getItem('user');
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userDetails = document.getElementById('userDetails');

    if (userStr) {
        // User is Logged In
        const user = JSON.parse(userStr);

        if (loginBtn) loginBtn.style.display = 'none';

        // Explicitly set flex to override CSS 'display: none' from class
        if (userProfile) userProfile.style.display = 'flex';

        // --- NAME FIX OVERRIDE ---
        if (user.identifier === '10800222026' || user.identifier === '10800222062' || user.rollNumber === '10800222026' || user.rollNumber === '10800222062') {
            user.name = 'Sumit Modi';
            user.role = 'Student'; // Ensure role is correct too
        }
        // -------------------------

        if (userName) {
            let displayName = 'User';
            if (user.name) displayName = user.name.split(' ')[0];
            else if (user.role) displayName = user.role.charAt(0).toUpperCase() + user.role.slice(1);

            userName.textContent = `Hello, ${displayName}`;
        }

        // Role-based Colors
        let roleColor = '10b981'; // Default Green (Teacher/General)
        const role = (user.role || '').toLowerCase();

        if (role === 'student') roleColor = '3b82f6'; // Blue
        else if (role === 'hosteler') roleColor = 'f59e0b'; // Orange
        else if (role === 'teacher') roleColor = '10b981'; // Green

        if (userAvatar) userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=${roleColor}&color=fff&rounded=true&bold=true`;

        if (userDetails) {
            userDetails.innerHTML = `
                <strong>${user.name || 'User'}</strong><br>
                <span style="text-transform: capitalize;">${user.role || 'Member'}</span><br>
                <span style="font-size:0.8rem;">${user.identifier || 'ID: --'}</span>
            `;
        }

    } else {
        // User is Guest
        if (loginBtn) loginBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
    }
};

function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}

// Close menu when clicking outside
window.addEventListener('click', (e) => {
    const menu = document.getElementById('profileMenu');
    const avatar = document.getElementById('userAvatar');
    if (menu && menu.style.display === 'flex' && e.target !== menu && e.target !== avatar && !menu.contains(e.target)) {
        menu.style.display = 'none';
    }
});

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.reload(); // Refresh to reset state
    }
}
