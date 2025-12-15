const ASSIGN_API_URL = 'http://localhost:5000/api/assignments';
let fetchedAssignments = [];
let currentAssignmentId = null;

// Run immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAssignments);
} else {
    loadAssignments();
}

async function loadAssignments() {
    const tableBody = document.getElementById('assignments-table-body');
    if (!tableBody) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Please login to view assignments.</td></tr>';
        return;
    }

    const user = JSON.parse(userStr);
    const { department, batch, section, token } = user;

    if (!department || !batch) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">Profile incomplete (Dept/Batch missing). Contact admin.</td></tr>';
        return;
    }

    try {
        const query = `?dept=${department}&batch=${batch}${section ? `&section=${section}` : ''}`;
        const response = await fetch(`${ASSIGN_API_URL}${query}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch assignments');
        }

        const assignments = await response.json();
        fetchedAssignments = assignments;

        if (assignments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">No pending assignments for your batch! 🎉</td></tr>';
            return;
        }

        tableBody.innerHTML = assignments.map((assign, index) => {
            const date = new Date(assign.deadline).toLocaleDateString('en-GB');
            const teacherName = assign.teacher ? assign.teacher.name : 'Unknown';

            // Status Logic
            let statusBadge;
            if (assign.submitted) {
                statusBadge = `<span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Submitted</span>`;
            } else {
                const isOverdue = new Date(assign.deadline) < new Date();
                statusBadge = isOverdue
                    ? `<span style="background: #fee2e2; color: #ef4444; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Overdue</span>`
                    : `<span style="background: #fff7ed; color: #f59e0b; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Pending</span>`;
            }

            return `
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                <td style="padding: 1rem; font-weight: 600; color: #2d3748;">
                    ${assign.title}
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 400;">${assign.subject}</div>
                </td>
                <td style="padding: 1rem; color: #64748b;">${teacherName}</td>
                <td style="padding: 1rem; color: #64748b;">${date}</td>
                <td style="padding: 1rem;">${statusBadge}</td>
                <td style="padding: 1rem;">
                    <div style="display: flex; gap: 5px;">
                        <button onclick="viewAssignment(${index})" class="btn-login" style="padding: 5px 15px; font-size: 0.8rem; background: #3b82f6; color:white; border:none; border-radius:6px; cursor:pointer;">
                            View Details
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading assignments.</td></tr>';
    }
}

// Update viewAssignment to clear file input
function viewAssignment(index) {
    const assignment = fetchedAssignments[index];
    if (!assignment) return;

    currentAssignmentId = assignment._id;

    // Populate Modal
    document.getElementById('modalTitle').innerText = assignment.title;
    document.getElementById('modalSubject').innerText = assignment.subject;
    document.getElementById('modalTeacher').innerText = 'By: ' + (assignment.teacher ? assignment.teacher.name : 'Unknown');
    document.getElementById('modalDeadline').innerText = 'Due: ' + new Date(assignment.deadline).toLocaleDateString('en-GB');

    document.getElementById('modalDescription').innerText = assignment.description;

    const linkContainer = document.getElementById('modalLinkContainer');
    const linkBtn = document.getElementById('modalLink');

    if (assignment.link && assignment.link.trim() !== "") {
        linkContainer.style.display = 'block';
        linkBtn.href = assignment.link;
    } else {
        linkContainer.style.display = 'none';
    }

    // Toggle Submission Form
    const submissionForm = document.getElementById('submissionForm');
    const submissionStatus = document.getElementById('submissionStatus');
    const submissionInput = document.getElementById('submissionFile'); // Changed ID

    if (assignment.submitted) {
        submissionForm.style.display = 'none';
        submissionStatus.style.display = 'block';
    } else {
        submissionForm.style.display = 'block';
        submissionStatus.style.display = 'none';
        if (submissionInput) submissionInput.value = ''; // Clear previous input
    }

    // Show Modal
    toggleModal('assignment-modal');
}

async function submitAssignment() {
    const fileInput = document.getElementById('submissionFile');
    const submitBtn = document.getElementById('submitBtn');

    if (!currentAssignmentId) return;

    if (!fileInput.files.length) {
        alert('Please select a PDF file to upload.');
        return;
    }

    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed.');
        return;
    }

    submitBtn.innerText = 'Submitting...';
    submitBtn.disabled = true;

    try {
        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${ASSIGN_API_URL}/${currentAssignmentId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user.token}`
                // Content-Type not needed for FormData
            },
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Submission failed');
        }

        // Success
        document.getElementById('submissionForm').style.display = 'none';
        document.getElementById('submissionStatus').style.display = 'block';

        // Refresh List to update status
        loadAssignments();
        alert('Assignment Submitted Successfully!');

    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        submitBtn.innerText = 'Mark as Done & Submit';
        submitBtn.disabled = false;
    }
}
