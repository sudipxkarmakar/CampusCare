const CONTENT_API_URL = 'http://localhost:5000/api/content/my-content';
let fetchedAssignments = [];
let fetchedNotes = [];
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
    // Backend 'getMyContent' uses req.user, so we just need the token.
    // We don't need to manually pass query params.

    try {
        const response = await fetch(CONTENT_API_URL, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch content');
        }

        const data = await response.json();

        // Data structure: { assignments: [], notes: [], notices: [] }
        const assignmentsList = data.assignments || [];
        const notesList = data.notes || [];

        // Store globally for modal access
        fetchedAssignments = assignmentsList;
        fetchedNotes = notesList; // Store notes too if needed for modal logic differentiation

        // Render ASSIGNMENTS
        if (assignmentsList.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">No pending assignments! 🎉</td></tr>';
        } else {
            tableBody.innerHTML = assignmentsList.map((assign, index) => {
                const date = new Date(assign.deadline).toLocaleDateString('en-GB');
                const teacherName = assign.teacher ? assign.teacher.name : 'Unknown';

                // Find original index in fetchedAssignments for viewAssignment to work correctly
                const originalIndex = fetchedAssignments.indexOf(assign);

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
                        <button onclick="viewAssignment(${originalIndex})" class="btn-login" style="padding: 5px 15px; font-size: 0.8rem; background: #3b82f6; color:white; border:none; border-radius:6px; cursor:pointer;">
                            View Details
                        </button>
                    </td>
                </tr>
                `;
            }).join('');
        }

        // Render NOTES
        const notesTableBody = document.getElementById('notes-table-body');
        if (notesTableBody) {
            if (notesList.length === 0) {
                notesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #64748b;">No notes available.</td></tr>';
            } else {
                notesTableBody.innerHTML = notesList.map((note, index) => {
                    // Note: Backend must populate 'uploadedBy'
                    const teacherName = note.uploadedBy ? note.uploadedBy.name : 'Unknown';
                    const title = note.topic || note.title || 'Untitled';

                    return `
                    <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <td style="padding: 1rem; font-weight: 600; color: #2d3748;">
                            ${title}
                        </td>
                        <td style="padding: 1rem; color: #64748b;">${note.subject}</td>
                        <td style="padding: 1rem; color: #64748b;">${teacherName}</td>
                        <td style="padding: 1rem;">
                            <button onclick="viewNote(${index})" class="btn-login" style="padding: 5px 15px; font-size: 0.8rem; background: #6366f1; color:white; border:none; border-radius:6px; cursor:pointer;">
                                <i class="fa-solid fa-book-open"></i> Read Note
                            </button>
                        </td>
                    </tr>
                    `;
                }).join('');
            }
        }

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
    document.getElementById('modalDeadline').innerText = assignment.deadline ? 'Due: ' + new Date(assignment.deadline).toLocaleDateString('en-GB') : 'No Deadline';

    document.getElementById('modalDescription').innerText = assignment.description;

    const linkContainer = document.getElementById('modalLinkContainer');
    const linkBtn = document.getElementById('modalLink');

    if (assignment.link && assignment.link.trim() !== "") {
        let href = assignment.link;
        if (href.startsWith('/')) {
            href = 'http://localhost:5000' + href; // Prepend Backend URL
        }

        linkContainer.style.display = 'block';
        linkBtn.href = href;
        linkBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Download Attached Notes';
    } else {
        linkContainer.style.display = 'none';
    }

    // Toggle Submission Form
    const submissionForm = document.getElementById('submissionForm');
    const submissionStatus = document.getElementById('submissionStatus');
    const submissionSection = document.getElementById('submissionSection');
    const submissionInput = document.getElementById('submissionFile');

    submissionSection.style.display = 'block';
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

function viewNote(index) {
    const note = fetchedNotes[index];
    if (!note) return;

    // Use same modal but adapt fields
    document.getElementById('modalTitle').innerText = note.topic || note.title;
    document.getElementById('modalSubject').innerText = note.subject;
    document.getElementById('modalTeacher').innerText = 'By: ' + (note.uploadedBy ? note.uploadedBy.name : 'Unknown');
    document.getElementById('modalDeadline').innerText = 'Resource'; // No deadline for notes

    document.getElementById('modalDescription').innerText = note.description || 'No description.';

    const linkContainer = document.getElementById('modalLinkContainer');
    const linkBtn = document.getElementById('modalLink');
    const noteLink = note.fileUrl || note.link;

    if (noteLink && noteLink.trim() !== "") {
        let href = noteLink;
        if (href.startsWith('/')) {
            href = 'http://localhost:5000' + href;
        }

        linkContainer.style.display = 'block';
        linkBtn.href = href;
        linkBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Download Note';
    } else {
        linkContainer.style.display = 'none';
    }

    // Hide Submission Section for Notes
    const submissionSection = document.getElementById('submissionSection');
    if (submissionSection) submissionSection.style.display = 'none';

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
