var BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '' || window.location.protocol === 'file:' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com');
var CONTENT_API_URL = BASE_URL + '/api/content/my-content';
var ASSIGN_API_URL = BASE_URL + '/api/assignments';
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

        // Show dynamic toast detailing submitted (raised) assignments
        const submittedCount = assignmentsList.filter(a => a.submitted).length;
        const totalCount = assignmentsList.length;
        if (typeof showSummaryToast === 'function') {
            showSummaryToast(submittedCount, totalCount);
        }

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

        // --- AI PRE-FILL LOGIC ---
        const aiSubject = sessionStorage.getItem('aiSubmitSubject');
        const aiTitle = sessionStorage.getItem('aiSubmitTitle');
        const aiAssignmentId = sessionStorage.getItem('aiSubmitAssignmentId');
        
        if (aiSubject || aiTitle || aiAssignmentId) {
            console.log(`[AI] searching for: subject=${aiSubject}, title=${aiTitle}`);
            // Remove from session so it doesn't pop up every time
            sessionStorage.removeItem('aiSubmitSubject');
            sessionStorage.removeItem('aiSubmitTitle');
            sessionStorage.removeItem('aiSubmitAssignmentId');

            const matchIndex = assignmentsList.findIndex(a => {
                if (aiAssignmentId && (a._id === aiAssignmentId || a.id === aiAssignmentId)) return true;
                const subjectMatch = aiSubject && a.subject.toLowerCase().includes(aiSubject.toLowerCase());
                const titleMatch = aiTitle && a.title.toLowerCase().includes(aiTitle.toLowerCase());
                
                // If both provided, try to find exact double match first, else fallback to either
                if (aiSubject && aiTitle) return subjectMatch && titleMatch;
                return subjectMatch || titleMatch;
            });

            // Fallback for partial match if double match failed
            let finalIndex = matchIndex;
            if (finalIndex === -1 && aiTitle) {
                finalIndex = assignmentsList.findIndex(a => a.title.toLowerCase().includes(aiTitle.toLowerCase()));
            }

            if (finalIndex !== -1) {
                setTimeout(() => viewAssignment(finalIndex), 500);
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
    renderAiAssignmentDraft(assignment);

    const linkContainer = document.getElementById('modalLinkContainer');
    const linkBtn = document.getElementById('modalLink');

    if (assignment.link && assignment.link.trim() !== "") {
        let href = assignment.link;
        if (href.startsWith('/')) {
            href = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '' + href; // Prepend Backend URL
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

function renderAiAssignmentDraft(assignment) {
    const draftText = sessionStorage.getItem('aiDraftAssignmentText');
    let box = document.getElementById('aiAssignmentDraftBox');

    if (!draftText) {
        if (box) box.style.display = 'none';
        return;
    }

    if (!box) {
        box = document.createElement('div');
        box.id = 'aiAssignmentDraftBox';
        box.style.cssText = 'margin:1rem 0; padding:1rem; border:1px solid #bfdbfe; border-radius:10px; background:#eff6ff;';
        const descriptionEl = document.getElementById('modalDescription');
        descriptionEl.parentNode.insertBefore(box, descriptionEl.nextSibling);
    }

    const formattedDraft = formatAiAssignmentDraftText(draftText);

    box.style.display = 'block';
    box.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:0.75rem;">
            <strong style="color:#1e40af;">Assistant Draft</strong>
            <button type="button" onclick="downloadAiAssignmentDraft()" style="background:#3b82f6; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">Download TXT</button>
        </div>
        <textarea id="aiAssignmentDraftText" rows="12" style="width:100%; border:1px solid #bfdbfe; border-radius:8px; padding:12px; font-family:inherit; line-height:1.6; white-space:pre-wrap; resize:vertical;"></textarea>
        <p style="font-size:0.8rem; color:#475569; margin:0.5rem 0 0;">Review this draft, export it if useful, and upload your final file yourself.</p>
    `;

    document.getElementById('aiAssignmentDraftText').value = formattedDraft;
}

function formatAiAssignmentDraftText(text) {
    return String(text || '')
        .replace(/\r\n/g, '\n')
        .replace(/\*\*/g, '')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/\s*(Student Name:|Student:|Assignment:|Subject:|Date of Submission:)/g, '\n$1')
        .replace(/\s*(Introduction:|Homework Questions:|Questions:|Answers:|Answer:|Conclusion:|Note:)/g, '\n\n$1')
        .replace(/(Introduction:|Homework Questions:|Questions:|Answers:|Answer:|Conclusion:|Note:)(?=\S)/g, '$1 ')
        .replace(/([:\n])\s*(\d+\.\s+)/g, '$1\n$2')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function downloadAiAssignmentDraft() {
    const text = document.getElementById('aiAssignmentDraftText')?.value || formatAiAssignmentDraftText(sessionStorage.getItem('aiDraftAssignmentText')) || '';
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assignment-draft.txt';
    a.click();
    URL.revokeObjectURL(url);
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
            href = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '' + href;
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

// Summary Toast notification on load
function showSummaryToast(submittedCount, totalCount) {
    if (sessionStorage.getItem('assignment_summary_toast_shown')) return;
    sessionStorage.setItem('assignment_summary_toast_shown', 'true');

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: white;
        border-left: 5px solid var(--primary);
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        padding: 16px 20px;
        border-radius: var(--radius-md);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Inter', sans-serif;
    `;
    
    toast.innerHTML = `
        <div style="background: var(--primary-light); color: var(--primary); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
            <i class="fa-solid fa-file-invoice"></i>
        </div>
        <div style="flex: 1;">
            <h5 style="margin: 0 0 2px 0; font-size: 0.95rem; font-weight: 700; color: var(--text-dark);">Assignment Status</h5>
            <p style="margin: 0; font-size: 0.8rem; color: var(--text-muted); line-height:1.4;">You have submitted (raised) <strong>${submittedCount}</strong> out of <strong>${totalCount}</strong> assignments.</p>
        </div>
        <button style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: var(--text-muted); margin-left: 8px;" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    if (!document.getElementById('toast-animation-style')) {
        const style = document.createElement('style');
        style.id = 'toast-animation-style';
        style.textContent = `
            @keyframes slideInUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.transition = 'opacity 0.5s, transform 0.5s';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 500);
        }
    }, 6000);
}
