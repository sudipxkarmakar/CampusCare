var API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api/hod';

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    setupProfile();
});

async function loadDashboardStats() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);

    // Verify Role
    if (user.role !== 'hod' && user.role !== 'admin') {
        alert('Unauthorized Access');
        window.location.href = '../index.html';
        return;
    }

    try {
        // Fetch dashboard summary
        const response = await fetch(`${API_URL}/dashboard`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (response.status === 401) {
            alert('Session expired. Please login again.');
            localStorage.removeItem('user');
            window.location.href = '../login.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to load stats');

        const data = await response.json();

        // Populate HOD department name
        const deptDisplay = document.getElementById('deptNameDisplay');
        if (deptDisplay) {
            deptDisplay.innerText = `Dept of ${data.department || user.department || 'N/A'}`;
        }

        // Student & Teacher counts
        const studentCountVal = document.getElementById('studentCountVal');
        if (studentCountVal) studentCountVal.innerText = data.studentCount;
        
        const insightStudentCount = document.getElementById('insight-student-count');
        if (insightStudentCount) insightStudentCount.innerText = data.studentCount;

        const teacherCountVal = document.getElementById('teacherCountVal');
        if (teacherCountVal) teacherCountVal.innerText = data.teacherCount;
        
        const insightTeacherCount = document.getElementById('insight-teacher-count');
        if (insightTeacherCount) insightTeacherCount.innerText = data.teacherCount;

        // Support Staff count
        try {
            const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com';
            const staffRes = await fetch(`${apiBase}/api/auth/staff`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (staffRes.ok) {
                const staff = await staffRes.json();
                const staffCountVal = document.getElementById('staffCountVal');
                if (staffCountVal) staffCountVal.innerText = staff.length;
            }
        } catch (e) {
            console.error('Error fetching staff count:', e);
        }

        // Leave Requests Stats
        const leaveCountVal = document.getElementById('leaveCountVal');
        if (leaveCountVal) leaveCountVal.innerText = data.pendingLeaves || 0;

        const leaveBadge = document.getElementById('leaveCountBadge');
        if (leaveBadge) {
            leaveBadge.innerText = data.pendingLeaves || 0;
            if (data.pendingLeaves > 0) leaveBadge.style.display = 'flex';
            else leaveBadge.style.display = 'none';
        }

        // Fetch complaints to count pending complaints
        try {
            const compRes = await fetch(`${API_URL}/complaints`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (compRes.ok) {
                const complaints = await compRes.json();
                const pendingComplaints = complaints.filter(c => c.status !== 'Resolved').length;
                const complaintsCountVal = document.getElementById('complaintsCountVal');
                if (complaintsCountVal) {
                    complaintsCountVal.innerText = pendingComplaints;
                }
            }
        } catch (e) {
            console.error('Error fetching complaints:', e);
        }

        // Fetch and render student preview list
        try {
            const studRes = await fetch(`${API_URL}/students`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (studRes.ok) {
                const students = await studRes.json();
                renderStudentPreview(students);
            }
        } catch (e) {
            console.error('Error fetching students list:', e);
        }

    } catch (error) {
        console.error(error);
        const deptDisplay = document.getElementById('deptNameDisplay');
        if (deptDisplay) deptDisplay.innerText = 'Error loading stats';
    }
}

function renderStudentPreview(students) {
    const tbody = document.getElementById('students-table-body');
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No students registered in this department yet.</td></tr>`;
        return;
    }

    let html = '';
    // Show top 5 students
    students.slice(0, 5).forEach(student => {
        const cgpa = student.cgpa ? parseFloat(student.cgpa).toFixed(2) : '--';
        const attendance = student.attendance ? `${student.attendance}%` : '--';
        const name = student.name || 'Student';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
        
        let performanceBadge = `<span style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; color: var(--text-dark);">${cgpa} CGPA</span>`;
        if (student.cgpa) {
            const cgpaVal = parseFloat(student.cgpa);
            if (cgpaVal >= 3.5) {
                performanceBadge = `<span style="background: #d1fae5; color: #059669; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 700;">A (${cgpa})</span>`;
            } else if (cgpaVal >= 3.0) {
                performanceBadge = `<span style="background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 700;">B (${cgpa})</span>`;
            } else if (cgpaVal >= 2.5) {
                performanceBadge = `<span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 700;">C (${cgpa})</span>`;
            }
        }

        html += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%;">
                        <div>
                            <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-dark);">${name}</span>
                            <span style="display:block; font-size:0.75rem; color: var(--text-muted);">${student.rollNumber || ''}</span>
                        </div>
                    </div>
                </td>
                <td style="font-size: 0.85rem; color: var(--text-muted);">${student.year || 'N/A'}</td>
                <td>${performanceBadge}</td>
                <td style="font-size: 0.85rem; font-weight: 600; color: var(--text-dark);">${attendance}</td>
                <td style="text-align: right;">
                    <a href="../modules/student-database/view.html" style="color: var(--primary); text-decoration: none;"><i class="fa-solid fa-eye" style="cursor: pointer;"></i></a>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function setupProfile() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('userProfile').style.display = 'flex';
        const firstName = user.name ? user.name.split(' ')[0] : 'HOD';
        document.getElementById('userName').innerText = `Hello, ${firstName}`;
        
        const greetingEl = document.getElementById('hod-greeting');
        if (greetingEl) {
            greetingEl.innerHTML = getGreetingText(firstName);
        }
        
        const badge = document.querySelector('.role-badge-mini');
        if (badge) {
            badge.textContent = 'HOD';
        }
        document.getElementById('userDetails').innerHTML = `
            <strong style="font-size: 1rem; color: var(--text-dark);">${user.name || 'User'}</strong>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; margin-left: 6px;">(ID: ${user.employeeId || user.rollNumber || user.identifier || 'N/A'})</span>
        `;
    }
}

function getGreetingText(name) {
    const hour = new Date().getHours();
    let salutation, icon;

    if (hour >= 0 && hour < 5)         { salutation = 'Good night';     icon = '🌙'; }
    else if (hour >= 5 && hour < 12)   { salutation = 'Good morning';   icon = '☀️'; }
    else if (hour >= 12 && hour < 17)  { salutation = 'Good afternoon'; icon = '☀️'; }
    else                               { salutation = 'Good evening';   icon = '🌆'; }
    
    return `${salutation}, <span style="color: var(--primary); font-weight: 800;">${name}</span>!<br><span style="font-size: 2.2rem; display: inline-block; margin-top: 8px;">${icon}</span>`;
}


