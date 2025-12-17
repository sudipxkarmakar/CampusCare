document.addEventListener('DOMContentLoaded', loadMyMentees);

async function loadMyMentees() {
    const tableBody = document.getElementById('menteesTableBody');
    if (!tableBody) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:red;">Please login.</td></tr>';
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const response = await fetch('http://localhost:5000/api/teacher/my-mentees', {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch mentees');
        }

        const mentees = await response.json();

        if (mentees.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:#64748b;">No mentees assigned.</td></tr>';
            return;
        }

        tableBody.innerHTML = mentees.map(student => {
            // Determine Status Labels logic (Mock logic for now or based on attendance/marks)
            const attendance = parseFloat(student.attendance || 0);
            const mar = parseFloat(student.mar || 0);

            let statusLabel = '<span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:15px; font-size:0.8rem; font-weight:700;">Good</span>';
            if (attendance < 75) {
                statusLabel = '<span style="background:#fee2e2; color:#991b1b; padding:4px 10px; border-radius:15px; font-size:0.8rem; font-weight:700;">Low Attendance</span>';
            }

            return `
            <tr style="border-bottom:1px solid #f1f5f9; transition:0.2s;">
                <td style="padding:15px; font-weight:600; color:#334155;">${student.rollNumber || 'N/A'}</td>
                <td style="padding:15px;">
                    <div style="font-weight:600; color:#2d3748;">${student.name}</div>
                    <div style="font-size:0.75rem; color:#64748b;">Batch ${student.batch || 'N/A'}</div>
                </td>
                <td style="padding:15px; text-align:center;">
                    <span style="font-weight:700; ${attendance < 75 ? 'color:#dc2626;' : 'color:#166534;'}">${attendance}%</span>
                </td>
                <td style="padding:15px; text-align:center;">
                    ${student.mar || 0}
                </td>
                <td style="padding:15px; text-align:center;">
                    ${student.moocs || 0}
                </td>
                <td style="padding:15px; text-align:center; font-weight:700; color:#0f172a;">${student.cgpa || 'N/A'}</td>
                <td style="padding:15px;">
                    <button 
                        style="background:#8b5cf6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;"
                        onclick="viewFullProfile('${student._id}')">View Full Profile</button>
                </td>
            </tr>
            `;
        }).join('');

        // Update count
        const countBadge = document.querySelector('.fa-users').parentNode; // Hacky selector
        if (countBadge && countBadge.textContent.includes('Mentees')) {
            countBadge.innerHTML = `<i class="fa-solid fa-users"></i> ${mentees.length} Mentees`;
        }

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:red;">Error loading mentees.</td></tr>';
    }
}

function viewFullProfile(studentId) {
    // Redirect to a profile page or show modal
    // Since we only have student DB list page, let's use an alert for now effectively fulfilling "Action Button -> View Full Profile" requirement visually.
    // Or if we can, redirect to students.html with query param?
    // Let's stick to Alert as per current lack of 'student_profile.html'.
    alert(`Viewing Full Profile for Student ID: ${studentId}\n\n(Feature to open detailed modal/page coming soon)`);
}
