const API_URL = 'http://localhost:5000/api/content/assignment'; // Check if this endpoint exists/matches

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createAssignmentForm');
    if (form) {
        form.addEventListener('submit', handleCreateAssignment);
    }

    // Populate Dropdowns from User Profile
    populateDropdowns();

    // Load created assignments
    loadCreatedAssignments();
});

// Global variable to store subject constraints
let enforcedSubjectsData = [];

function populateDropdowns() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    // Store enforced subjects for dynamic filtering
    enforcedSubjectsData = user.enforcedSubjects || [];

    // 1. Department
    const deptSelect = document.getElementById('assignDept');
    if (deptSelect) {
        if (user.department) {
            deptSelect.innerHTML = `<option value="${user.department}">${user.department}</option>`;
        } else {
            deptSelect.innerHTML = `<option value="">No Dept Assigned</option>`;
        }
    }

    // 2. Subjects
    const subjectSelect = document.getElementById('assignSubject');
    if (subjectSelect) {
        if (enforcedSubjectsData.length > 0) {
            subjectSelect.innerHTML = '<option value="">Select Subject</option>' +
                enforcedSubjectsData.map(sub => `<option value="${sub.name}">${sub.name}</option>`).join('');

            // Add Change Listener
            subjectSelect.addEventListener('change', handleSubjectChange);
        } else if (user.teachingSubjects && user.teachingSubjects.length > 0) {
            // Fallback to old behavior if no enforced data
            subjectSelect.innerHTML = '<option value="">Select Subject</option>' +
                user.teachingSubjects.map(sub => `<option value="${sub}">${sub}</option>`).join('');
        } else {
            subjectSelect.innerHTML = `<option value="">No Subjects Assigned</option>`;
        }
    }
}

function handleSubjectChange(e) {
    const selectedSubjectName = e.target.value;
    const subjectData = enforcedSubjectsData.find(s => s.name === selectedSubjectName);

    const yearSelect = document.getElementById('assignYear');
    const batchSelect = document.getElementById('assignBatch');

    if (!subjectData) {
        // Reset if no subject or invalid
        if (yearSelect) yearSelect.value = "";
        if (batchSelect) batchSelect.innerHTML = '<option value="">Select Batch</option>';
        return;
    }

    // 1. Auto-select Year and LOCK it
    if (yearSelect && subjectData.year) {
        yearSelect.value = subjectData.year;
        yearSelect.disabled = true; // Prevent manual change
        // Add a hidden input if needed to ensure value is sent during submit, 
        // OR ensure we re-enable before submit (or rely on value if using FormData/JSON manually)
        // Since we explicitly grab .value in handleCreateAssignment, disabled fields usually don't return value in form.submit() but 
        // strictly, document.getElementById('id').value works even if disabled.
    }

    // 2. Filter Batches
    if (batchSelect) {
        if (subjectData.allowedBatches && subjectData.allowedBatches.length > 0) {
            batchSelect.innerHTML = '<option value="">Select Batch</option>' +
                subjectData.allowedBatches.map(b => `<option value="${b}">Batch ${b}</option>`).join('');

            // Auto-select if only one batch
            if (subjectData.allowedBatches.length === 1) {
                batchSelect.value = subjectData.allowedBatches[0];
            }
        } else {
            batchSelect.innerHTML = '<option value="">No Batches Assigned for this Subject</option>';
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
    const deadline = document.getElementById('assignDeadline').value;
    const description = document.getElementById('assignDesc').value;

    if (!subject || !batch || !department || !year) {
        alert("Please ensure all fields are selected (Subject, Batch, Department, Year).");
        return;
    }

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        // Note: The controller at /api/content/assignment or /api/assignments (check controller import)
        // assignmentController.js exports to assignmentRoutes using /api/assignments usually.
        // Let's verify the URL. The previous file had http://localhost:5000/api/content/assignment
        // I should probably use http://localhost:5000/api/assignments based on standard REST.
        // I will assume /api/assignments for now but if 404 I check routes.

        const response = await fetch('http://localhost:5000/api/assignments', { // Updated URL
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
                deadline
                // No subBatch
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Assignment created successfully!');
            document.getElementById('createAssignmentForm').reset();
            // Re-populate because reset clears dynamic single-options?
            // Actually reset affects value. department has only 1 option, so it selects it.
            loadCreatedAssignments();
        } else {
            alert(data.message || 'Failed to create assignment.');
        }
    } catch (error) {
        console.error('Error creating assignment:', error);
        alert('Server error. Please try again.');
    }
}

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
        // Endpoint for getting assignments created by teacher
        // Checked controller: getTeacherAssignments => GET /api/assignments/created (implied)

        const response = await fetch('http://localhost:5000/api/assignments/created', {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch created assignments');
        }

        const assignments = await response.json();

        // Filter out Notes if mixed
        const assignmentsList = assignments.filter(a => a.type !== 'note');

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
                        <button onclick="viewSubmissions('${assign._id}', '${assign.title}')" 
                            style="padding: 5px 15px; font-size: 0.8rem; background: #3b82f6; color:white; border:none; border-radius:6px; cursor:pointer;">
                            View Submissions
                        </button>
                    </td>
                </tr>
                `;
            }).join('');
        }

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading assignments.</td></tr>';
    }
}

async function viewSubmissions(assignmentId, title) {
    document.getElementById('modalAssignmentTitle').innerText = `For Assignment: ${title}`;
    const tableBody = document.getElementById('submissionsTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';

    toggleModal('submissions-modal');

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);

    try {
        const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}/submissions`, {
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
                        href = 'http://localhost:5000' + href;
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
