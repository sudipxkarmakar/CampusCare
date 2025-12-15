const API_URL = 'http://localhost:5000/api/assignments';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createAssignmentForm');
    if (form) {
        form.addEventListener('submit', handleCreateAssignment);
    }
});

async function handleCreateAssignment(e) {
    e.preventDefault();

    const title = document.getElementById('assignTitle').value;
    const subject = document.getElementById('assignSubject').value;
    const department = document.getElementById('assignDept').value;
    const batch = document.getElementById('assignBatch').value;
    const deadline = document.getElementById('assignDeadline').value;
    const description = document.getElementById('assignDesc').value;
    const link = document.getElementById('assignLink').value;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('Please login first.');
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                title,
                subject,
                department,
                batch,
                deadline,
                description,
                link,
                teacherId: user._id // Validated by backend
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Assignment/Notes uploaded successfully!');
            document.getElementById('createAssignmentForm').reset();
        } else {
            alert(data.message || 'Failed to upload assignment.');
        }
    } catch (error) {
        console.error('Error uploading assignment:', error);
        alert('Server error. Please try again.');
    }
}

// --- VIEW ASSIGNMENTS SECTION ---

// Load Created Assignments
async function loadCreatedAssignments() {
    const tableBody = document.getElementById('teacherAssignmentsTable');
    if (!tableBody) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Please login.</td></tr>';
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/created`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch created assignments');
        }

        const assignments = await response.json();

        if (assignments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b;">You haven\'t created any assignments yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = assignments.map(assign => {
            const date = new Date(assign.deadline).toLocaleDateString('en-GB');
            return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 1rem; color: #2d3748; font-weight: 500;">
                    ${assign.title}
                    <div style="font-size: 0.8rem; color: #64748b;">${assign.subject}</div>
                </td>
                <td style="padding: 1rem; color: #64748b;">${assign.department} - ${assign.batch}</td>
                <td style="padding: 1rem; color: #64748b;">${date}</td>
                <td style="padding: 1rem;">
                    <button onclick="viewSubmissions('${assign._id}', '${assign.title}')" class="btn-login" 
                        style="padding: 5px 15px; font-size: 0.8rem; background: #3b82f6; color:white; border:none; border-radius:6px; cursor:pointer;">
                        View Submissions
                    </button>
                    ${assign.link ? `<a href="${assign.link}" target="_blank" style="margin-left: 5px; color: #3b82f6;"><i class="fa-solid fa-link"></i></a>` : ''}
                </td>
            </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading assignments.</td></tr>';
    }
}

// Check Submissions for an Assignment
async function viewSubmissions(assignmentId, title) {
    document.getElementById('modalAssignmentTitle').innerText = `For Assignment: ${title}`;
    const tableBody = document.getElementById('submissionsTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';

    toggleModal('submissions-modal');

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`${API_URL}/${assignmentId}/submissions`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch submissions');

        const submissions = await response.json();

        if (submissions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: #64748b;">No submissions yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = submissions.map(sub => {
            const date = new Date(sub.createdAt).toLocaleString('en-GB');
            const studentName = sub.student ? sub.student.name : 'Unknown Student';
            const rollNo = sub.student && sub.student.rollNumber ? sub.student.rollNumber : 'N/A';

            return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 0.8rem; font-weight: 500; color: #334155;">${studentName}</td>
                <td style="padding: 0.8rem; color: #64748b;">${rollNo}</td>
                <td style="padding: 0.8rem; color: #64748b; font-size: 0.85rem;">${date}</td>
                <td style="padding: 0.8rem;">
                    ${(() => {
                    if (!sub.link) return '<span style="color:#94a3b8;">No Link</span>';
                    let href = sub.link;
                    if (sub.link.startsWith('/')) {
                        // It's a relative path to the backend, prepend server origin
                        // API_URL is http://localhost:5000/api/assignments
                        // We need http://localhost:5000
                        const origin = 'http://localhost:5000';
                        href = origin + sub.link;
                    }
                    return `<a href="${href}" target="_blank" style="color: #3b82f6; font-weight: 600; text-decoration: none;"><i class="fa-solid fa-file-pdf"></i> View File</a>`;
                })()}
                </td>
            </tr>
            `;
        }).join('');

    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error fetching submissions.</td></tr>';
    }
}

// Init
document.addEventListener('DOMContentLoaded', loadCreatedAssignments);
