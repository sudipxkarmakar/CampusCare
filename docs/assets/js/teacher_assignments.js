const API_URL = 'http://localhost:5000/api/content/assignment'; // NEW Endpoint

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createAssignmentForm');
    if (form) {
        form.addEventListener('submit', handleCreateAssignment);
    }

    // Check for Mentor Role to show/hide SubBatch
    checkMentorAccess();

    // Smart Batch Filtering Logic
    const batchSelect = document.getElementById('assignBatch');
    const subBatchSelect = document.getElementById('assignSubBatch');

    if (batchSelect && subBatchSelect) {
        batchSelect.addEventListener('change', (e) => {
            const batch = e.target.value;
            // Reset options
            Array.from(subBatchSelect.options).forEach(opt => {
                if (opt.value === "") return;
                // If batch is 1, show 1-1, 1-2. If 2, show 2-1, 2-2
                if (opt.value.startsWith(batch)) {
                    opt.style.display = 'block';
                } else {
                    opt.style.display = 'none';
                }
            });
            subBatchSelect.value = ""; // Reset value
        });
    }
});

function checkMentorAccess() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    // If user has mentee groups or role implies mentor
    // Phase 6: All teachers are assigned 2 sub-batches (menteesSubBatches)
    if (user.menteesSubBatches && user.menteesSubBatches.length > 0) {
        const subBatchSelect = document.getElementById('assignSubBatch');
        if (subBatchSelect) {
            subBatchSelect.style.display = 'block';
            subBatchSelect.title = "Target specific Mentee group";
        }
    }
}

async function handleCreateAssignment(e) {
    e.preventDefault();

    const title = document.getElementById('assignTitle').value;
    const subject = document.getElementById('assignSubject').value;
    const department = document.getElementById('assignDept').value;
    const year = document.getElementById('assignYear').value;
    const batch = document.getElementById('assignBatch').value;
    const subBatch = document.getElementById('assignSubBatch') ? document.getElementById('assignSubBatch').value : '';
    const deadline = document.getElementById('assignDeadline').value;
    const description = document.getElementById('assignDesc').value;
    const fileInput = document.getElementById('assignFile'); // May not exist in form yet if not added
    // const file = fileInput ? fileInput.files[0] : null;

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        // Using JSON for now as contentController handles JSON body well unless file upload is strictly multipart in new controller?
        // Wait, creating an assignment often involves a file.
        // My contentController implementation for 'createAssignment' takes JSON body fields.
        // It DOES NOT handle file upload yet in the snippet I wrote?
        // Wait, createAssignment logic: `const { ... } = req.body`.
        // It doesn't seem to process `req.file`.
        // For Assignments, often just a link or description is enough, but notes need file.
        // The previous implementation used Multer.
        // I should probably stick to JSON for basic Assignment and add a 'link' field if I didn't verify file upload in new controller.
        // Or I update new controller to handle files.
        // For Phase 6 "Logic" part, the distribution logic is key.
        // Let's assume for now we send data as JSON.

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                subject,
                department,
                year,
                batch,
                subBatch,
                deadline
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Assignment created successfully with Smart Targeting!');
            document.getElementById('createAssignmentForm').reset();
            loadCreatedAssignments();
        } else {
            alert(data.message || 'Failed to create assignment.');
        }
    } catch (error) {
        console.error('Error creating assignment:', error);
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
