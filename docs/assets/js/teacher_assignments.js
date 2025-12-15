const API_URL = 'http://localhost:5000/api/assignments';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createAssignmentForm');
    if (form) {
        form.addEventListener('submit', handleCreateAssignment);
    }
});

async function handleCreateAssignment(e) {
    e.preventDefault();

    const type = document.getElementById('assignType').value;
    const title = document.getElementById('assignTitle').value;
    const subject = document.getElementById('assignSubject').value;
    const department = document.getElementById('assignDept').value;
    const batch = document.getElementById('assignBatch').value;
    const deadline = document.getElementById('assignDeadline').value;
    const description = document.getElementById('assignDesc').value;
    const fileInput = document.getElementById('assignFile');
    const file = fileInput.files[0];

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        alert('Please login first.');
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);

    try {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('title', title);
        formData.append('subject', subject);
        formData.append('department', department);
        formData.append('batch', batch);
        formData.append('deadline', deadline);
        formData.append('description', description);
        formData.append('teacherId', user._id); // Validated by backend

        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Only PDF files are allowed for notes.');
                return;
            }
            formData.append('file', file);
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user.token}`
                // Content-Type: multipart/form-data required (browser sets it automatically with boundary)
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            alert('Assignment/Notes uploaded successfully!');
            document.getElementById('createAssignmentForm').reset();
            loadCreatedAssignments(); // Refresh list immediately
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

        // Split into Assignments and Notes
        const assignmentsList = assignments.filter(a => a.type !== 'note');
        const notesList = assignments.filter(a => a.type === 'note');

        // Render Assignments
        if (assignmentsList.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b;">No assignments created.</td></tr>';
        } else {
            tableBody.innerHTML = assignmentsList.map(assign => {
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
                    </td>
                </tr>
                `;
            }).join('');
        }

        // Render Notes
        const notesTableBody = document.getElementById('teacherNotesTable');
        if (notesTableBody) {
            if (notesList.length === 0) {
                notesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #64748b;">No notes uploaded.</td></tr>';
            } else {
                notesTableBody.innerHTML = notesList.map(note => {
                    const date = new Date(note.createdAt).toLocaleDateString('en-GB');

                    let notesLink = '';
                    if (note.link) {
                        let href = note.link;
                        if (href.startsWith('/')) {
                            href = 'http://localhost:5000' + href;
                        }
                        notesLink = `<a href="${href}" target="_blank" style="color: #3b82f6; font-weight:600; text-decoration:none;"><i class="fa-solid fa-file-pdf"></i> View File</a>`;
                    } else {
                        notesLink = '<span style="color: #94a3b8;">No File</span>';
                    }

                    return `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 1rem; color: #2d3748; font-weight: 500;">
                            ${note.title}
                            <div style="font-size: 0.8rem; color: #64748b;">${note.subject}</div>
                        </td>
                        <td style="padding: 1rem; color: #64748b;">${note.department} - ${note.batch}</td>
                        <td style="padding: 1rem; color: #64748b;">${date}</td>
                        <td style="padding: 1rem;">
                            ${notesLink}
                        </td>
                    </tr>
                    `;
                }).join('');
            }
        }

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
