// HOD Subject Allocation Logic

var BASE_API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api';

const yearMapping = {
    "2026": "4th Year",
    "2027": "3rd Year",
    "2028": "2nd Year",
    "2029": "1st Year"
};

const academicYearMapping = {
    "1st Year": "2029",
    "2nd Year": "2028",
    "3rd Year": "2027",
    "4th Year": "2026"
};

let currentSubjectForAssign = null; // Track which subject we are adding a teacher to
let subjectToDeleteId = null; // Track which subject we are deleting

// --- CENTRALIZED EVENT DELEGATION ---

document.addEventListener("click", (e) => {
    // 1. Add Teacher Button (On Subject Card)
    const addTeacherBtn = e.target.closest(".add-teacher-btn");
    if (addTeacherBtn) {
        e.preventDefault();
        e.stopPropagation();
        const subjectId = addTeacherBtn.dataset.id;
        const subjectName = addTeacherBtn.dataset.name;
        const batchName = addTeacherBtn.dataset.batch; // New
        openTeacherExpertiseModalForSubject(subjectId, subjectName, batchName);
        return;
    }

    // 2. Delete Subject Icon (Refactored to event delegation)
    const deleteBtn = e.target.closest(".delete-subject-btn");
    if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const subjectId = deleteBtn.dataset.id;
        console.log("Delete button clicked via delegation for ID:", subjectId);
        openDeleteModal(e, subjectId);
        return;
    }

    // 3. Add Subject Button (Main Header)
    if (e.target.closest(".add-subject-btn")) {
        e.preventDefault();
        openAddSubjectModal();
        return;
    }

    // 4. Modal Close Buttons (Handles cross icon & cancel buttons)
    const closeBtn = e.target.closest(".close-modal-btn, .close-modal-btn-action");
    if (closeBtn) {
        e.preventDefault();
        const modalId = closeBtn.dataset.modal;
        if (modalId) {
            document.getElementById(modalId).style.display = 'none';
            if (modalId === 'deleteSubjectModal') subjectToDeleteId = null;
        }
        return;
    }

    // 5. Confirm Delete Subject (inside modal)
    const confirmDeleteBtn = e.target.closest(".confirm-delete-subject-btn");
    if (confirmDeleteBtn) {
        e.preventDefault();
        confirmDeleteSubject();
        return;
    }

    // 6. Unassign Teacher Button
    const unassignBtn = e.target.closest(".unassign-teacher-btn");
    if (unassignBtn) {
        e.preventDefault();
        e.stopPropagation();
        const subjectId = unassignBtn.dataset.id;
        const batchName = unassignBtn.dataset.batch;
        unassignTeacher(subjectId, batchName);
        return;
    }

    // 7. Close Modal when clicking outside (backdrop)
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = "none";
        if (e.target.id === 'deleteSubjectModal') subjectToDeleteId = null;
    }
});

function getAuthToken() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            return user.token;
        } catch (e) {
            console.error("Error parsing user token", e);
            return null;
        }
    }
    return localStorage.getItem('token');
}

// --- LOAD DATA ---

document.addEventListener('DOMContentLoaded', () => {
    checkAuth(); // Verify auth on load
    const yearSelect = document.getElementById('academicYearFilter');
    if (yearSelect) {
        yearSelect.value = "4th Year";
        handleMainYearChange();
        yearSelect.addEventListener('change', handleMainYearChange);
    }
    const semSelect = document.getElementById('semesterFilter');
    if (semSelect) {
        semSelect.addEventListener('change', loadSubjects);
    }

    // Modal elements listeners
    const modalStudentYearSelect = document.getElementById('modalStudentYear');
    if (modalStudentYearSelect) {
        modalStudentYearSelect.addEventListener('change', handleModalYearChange);
    }
    const manualNameInput = document.getElementById('manualName');
    if (manualNameInput) {
        const updateCode = () => {
            const val = manualNameInput.value;
            const match = SUBJECT_CATALOG.find(s => s.name.toLowerCase() === val.toLowerCase());
            if (match) {
                document.getElementById('manualCode').value = match.code;
            }
        };
        manualNameInput.addEventListener('input', updateCode);
        manualNameInput.addEventListener('change', updateCode);
    }
    const addSubjectForm = document.getElementById('addSubjectForm');
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', handleAddSubject);
    }
});

async function loadSubjects() {
    const studentYear = document.getElementById('academicYearFilter').value;
    const semester = document.getElementById('semesterFilter').value;
    const batch = 'all';

    if (!studentYear) return;
    const year = academicYearMapping[studentYear];
    if (!year) return;

    const listDiv = document.getElementById('subjectList');
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');

    listDiv.innerHTML = '';
    listDiv.style.display = 'none';
    loading.style.display = 'block';
    empty.style.display = 'none';

    try {
        const token = getAuthToken();
        const dept = 'IT';

        let url = `${BASE_API}/subjects?dept=${dept}&academicYear=${year}`;
        if (semester && semester !== 'all') {
            url += `&semester=${semester}`;
        }

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const subjects = await res.json();

        // Client-side filtering as backup
        const finalSubjects = subjects.filter(sub => {
            let match = true;
            if (semester && semester !== 'all') match = match && (sub.semester == semester);
            return match;
        });

        loading.style.display = 'none';

        if (finalSubjects.length === 0) {
            empty.style.display = 'block';
        } else {
            listDiv.style.display = 'grid';
            finalSubjects.forEach(sub => {
                const card = createSubjectCard(sub);
                listDiv.appendChild(card);
            });
        }

    } catch (err) {
        console.error(err);
        loading.style.display = 'none';
        alert('Failed to load subjects');
    }
}

function handleMainYearChange() {
    const studentYear = document.getElementById('academicYearFilter').value;
    const year = academicYearMapping[studentYear];
    const semSelect = document.getElementById('semesterFilter');

    semSelect.innerHTML = '<option value="all">All Semesters</option>';

    if (year && subjectDataMap[year]) {
        subjectDataMap[year].semesters.forEach(sem => {
            const opt = document.createElement('option');
            opt.value = sem;
            opt.textContent = `Semester ${sem}`;
            semSelect.appendChild(opt);
        });
    }

    loadSubjects();
}

function createSubjectCard(subject) {
    const div = document.createElement('div');
    div.className = 'subject-card';

    // Helper to get teacher for a batch
    const getTeacherForBatch = (batchName) => {
        if (!subject.batchAssignments) return null;
        const assignment = subject.batchAssignments.find(ba => ba.batch === batchName);
        return assignment ? assignment.teacher : null;
    };

    const b1Teacher = getTeacherForBatch('Batch 1');
    const b2Teacher = getTeacherForBatch('Batch 2');

    const renderBatchSlot = (batchName, teacher) => {
        const teacherName = teacher ? teacher.name : 'Not Assigned';
        const color = teacher ? 'var(--primary)' : 'var(--text-muted)';
        const icon = teacher ? '<i class="fa-solid fa-chalkboard-user"></i>' : '<i class="fa-regular fa-user"></i>';
        const btnTitle = teacher ? "Change Teacher" : "Assign Teacher";

        let actionButtons = `
            <button class="add-teacher-btn" data-id="${subject._id}" data-name="${subject.name}" data-batch="${batchName}"
                style="background: var(--primary-light); border: 1px solid var(--border-color); color: var(--primary); width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                onmouseenter="this.style.background='var(--primary)'; this.style.color='white';"
                onmouseleave="this.style.background='var(--primary-light)'; this.style.color='var(--primary)';"
                title="${btnTitle}">
                <i class="fa-solid fa-pen" style="font-size:0.7rem;"></i>
            </button>
        `;

        if (teacher) {
            actionButtons += `
                <button class="unassign-teacher-btn" data-id="${subject._id}" data-batch="${batchName}"
                    style="margin-left:5px; background: var(--danger-light); border: 1px solid var(--border-color); color: var(--danger); width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                    onmouseenter="this.style.background='var(--danger)'; this.style.color='white';"
                    onmouseleave="this.style.background='var(--danger-light)'; this.style.color='var(--danger)';"
                    title="Unassign Teacher">
                    <i class="fa-solid fa-trash-can" style="font-size:0.7rem;"></i>
                </button>
            `;
        }

        return `
            <div style="padding:10px 12px; background:#f8fafc; border-radius:10px; border:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                <div style="min-width:0;">
                    <div style="font-size:0.7rem; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">${batchName}</div>
                    <div style="font-size:0.85rem; color:${color}; font-weight:600; display:flex; align-items:center; gap:6px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${teacherName}">
                        ${icon} <span style="overflow:hidden; text-overflow:ellipsis;">${teacherName}</span>
                    </div>
                </div>
                <div style="display:flex; flex-shrink:0; margin-left:12px;">
                    ${actionButtons}
                </div>
            </div>
        `;
    };

    div.innerHTML = `
        <div style="width:100%; display:flex; flex-direction:column; gap:16px;">
            <div style="display:flex; gap:14px; align-items:flex-start;">
                <div style="width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0; background: linear-gradient(135deg, #ede9fe, #ddd6fe); color: var(--primary);">
                    <i class="fa-solid fa-book-bookmark"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <h3 style="color:#1e1b4b; margin:0; font-size:1.05rem; font-weight:700; line-height:1.3; font-family:'Poppins', sans-serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${subject.name}">${subject.name}</h3>
                        <button class="delete-btn-hover delete-subject-btn" data-id="${subject._id}"
                                style="border:none; background:none; color:#f87171; cursor:pointer; font-size:1rem; padding:4px; display:flex; align-items:center; justify-content:center; transition:color 0.2s; margin-left:8px;" 
                                onmouseenter="this.style.color='#ef4444';"
                                onmouseleave="this.style.color='#f87171';"
                                title="Delete Subject">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    <div style="font-size:0.8rem; color:#64748b; font-family:monospace; margin-top:2px; font-weight:600;">${subject.code}</div>
                </div>
            </div>
            
            <div style="font-size:0.8rem; font-weight:600; color:#475569; display:flex; gap:8px;">
                <span style="background:#f1f5f9; padding:4px 10px; border-radius:8px; border:1px solid #e2e8f0;">${subject.year}</span>
                <span style="background:#f1f5f9; padding:4px 10px; border-radius:8px; border:1px solid #e2e8f0;">Semester ${subject.semester}</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px; border-top:1px dashed #e2e8f0; padding-top:12px;">
                ${renderBatchSlot('Batch 1', b1Teacher)}
                ${renderBatchSlot('Batch 2', b2Teacher)}
            </div>
        </div>
    `;

    return div;
}

// --- TEACHER EXPERTISE MODAL (CONTEXTUAL) ---

async function openTeacherExpertiseModalForSubject(subjectId, subjectName, batchName) {
    currentSubjectForAssign = { id: subjectId, name: subjectName, batch: batchName };
    const modal = document.getElementById('teacherExpertiseModal');
    modal.style.display = 'flex';

    const title = modal.querySelector('h2');
    if (title) title.innerText = `Assign Teacher for: ${subjectName} (${batchName})`;

    await loadTeacherExpertise(subjectName);
}

async function loadTeacherExpertise(filterSubjectName = null) {
    const listBody = document.getElementById('teacherExpertiseList');
    listBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

    try {
        const token = getAuthToken();
        const user = JSON.parse(localStorage.getItem('user'));
        const dept = user.department || 'IT';

        // Use HOD specific endpoint which is accessible
        const res = await fetch(`${BASE_API}/hod/teachers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || res.statusText || 'Failed to fetch teachers');
        }
        let teachers = await res.json();
        // The HOD endpoint returns already filtered list of teachers in the department
        // so we don't need to filter by role or fetch all dept users first


        // Strict filtering as requested by user
        if (filterSubjectName) {
            const lowerSub = filterSubjectName.toLowerCase();
            teachers = teachers.filter(t => {
                const expertise = (t.expertise || []).map(e => e.toLowerCase());
                const specialization = (t.specialization || '').toLowerCase();

                // Check for partial match logic
                const hasExpertise = expertise.some(e => lowerSub.includes(e) || e.includes(lowerSub));
                const hasSpec = specialization && (specialization.includes(lowerSub) || lowerSub.includes(specialization));

                return hasExpertise || hasSpec;
            });
        }

        listBody.innerHTML = '';
        if (teachers.length === 0) {
            listBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#64748b;">No teachers found with expertise in <strong>${filterSubjectName}</strong></td></tr>`;
            return;
        }

        teachers.forEach(t => {
            const tr = document.createElement('tr');

            // Formatted Expertise string
            let expertiseText = (t.expertise && t.expertise.length > 0) ? t.expertise.join(', ') : (t.specialization || '-');

            // Action
            const btn = document.createElement('button');
            btn.textContent = 'Assign';
            btn.className = 'assign-action-btn';
            btn.style.cssText = "background: var(--primary); color: white; border: none; padding: 6px 16px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.2s;";
            btn.onmouseenter = () => btn.style.background = '#5530a6';
            btn.onmouseleave = () => btn.style.background = 'var(--primary)';

            btn.onclick = () => assignTeacherToCurrentSubject(t._id);

            tr.innerHTML = `
                <td style="padding:12px; font-weight:500;">${t.name}</td>
                <td style="padding:12px; color:#64748b;">${t.designation || 'Faculty'}</td>
                <td style="padding:12px;">${expertiseText}</td>
            `;
            const tdAction = document.createElement('td');
            tdAction.style.padding = '12px';
            tdAction.appendChild(btn);
            tr.appendChild(tdAction);

            listBody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        listBody.innerHTML = `<tr><td colspan="4" style="color:red;">Failed to load: ${err.message}</td></tr>`;
    }
}

async function assignTeacherToCurrentSubject(teacherId) {
    if (!currentSubjectForAssign) return;

    if (!confirm(`Assign this teacher to ${currentSubjectForAssign.name}?`)) return;

    // Use existing assign endpoint
    // We reuse the /subjects/assign-teacher endpoint which expects { subjectId, teacherId, academicYear }
    // We need academicYear from global filter
    const academicYear = document.getElementById('academicYearFilter').value;

    try {
        const token = getAuthToken();
        // Note: assignSubjectTeacher is in hodRoutes, so we must access via /api/hod
        const res = await fetch(`${BASE_API}/hod/subjects/${currentSubjectForAssign.id}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                teacherId,
                batch: currentSubjectForAssign.batch // Send the batch!
            })
        });

        if (res.ok) {
            alert('Teacher assigned successfully!');
            document.getElementById('teacherExpertiseModal').style.display = 'none';
            loadSubjects(); // Refresh list
        } else {
            const err = await res.json();
            alert('Error: ' + (err.message || 'Failed to assign teacher'));
        }
    } catch (err) {
        console.error(err);
        alert('Failed to assign teacher: ' + err.message);
    }
}

async function unassignTeacher(subjectId, batch) {
    if (!confirm(`Are you sure you want to remove the teacher from ${batch}?`)) return;

    try {
        const token = getAuthToken();
        const res = await fetch(`${BASE_API}/hod/subjects/${subjectId}/unassign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ batch })
        });

        if (res.ok) {
            alert('Teacher removed successfully');
            loadSubjects();
        } else {
            const err = await res.json();
            alert('Error: ' + (err.message || 'Failed to remove teacher'));
        }
    } catch (error) {
        console.error("Unassign Error:", error);
        alert('Failed to remove teacher.');
    }
}


// --- DATA MAPPING ---

const subjectDataMap = {
    "2026": { semesters: [7, 8] },
    "2027": { semesters: [5, 6] },
    "2028": { semesters: [3, 4] },
    "2029": { semesters: [1, 2] }
};

// --- SUBJECT CATALOG FOR AUTO-FILL ---
const SUBJECT_CATALOG = [
    { name: "Internet Technology", code: "IT701" },
    { name: "Cyber Security", code: "CS702" },
    { name: "Soft Skills", code: "HU701" },
    { name: "Project Management & Entrepreneurship", code: "HU702" },
    { name: "Cryptography", code: "CS801" },
    { name: "Network Security", code: "CS802" },
    { name: "Internet of Things", code: "CS803" },
    { name: "Software Engineering", code: "CS501" },
    { name: "Compiler Design", code: "CS502" },
    { name: "Operating Systems", code: "CS503" },
    { name: "Introduction to Industrial Management", code: "HU501" },
    { name: "Artificial Intelligence", code: "CS504" },
    { name: "Database Management System", code: "CS601" },
    { name: "Computer Networks", code: "CS602" },
    { name: "Distributed System", code: "CS603" },
    { name: "Data Warehouse & Data Mining", code: "CS604" },
    { name: "Analog & Digital Electronics", code: "CS301" },
    { name: "Data Structures & Algorithms", code: "CS302" },
    { name: "Computer Organization", code: "CS303" },
    { name: "Differential Calculus", code: "BS301" },
    { name: "Economics for Engineers", code: "HU301" },
    { name: "Discrete Mathematics", code: "M401" },
    { name: "Computer Architecture", code: "CS401" },
    { name: "Formal Languages & Automata Theory", code: "CS402" },
    { name: "Design & Analysis of Algorithms", code: "CS403" },
    { name: "Biology for Engineers", code: "BS401" },
    { name: "Environmental Science", code: "HU401" },
    { name: "Physics for Engineers", code: "PH101" },
    { name: "Chemistry for Engineers", code: "CH101" },
    { name: "Mathematics for Engineers", code: "M101" },
    { name: "Calculus & Integration", code: "M201" },
    { name: "Basic Electrical Engineering", code: "EE201" }
];

function populateSubjectDatalist() {
    const datalist = document.getElementById('subjectOptions');
    if (!datalist) return;
    datalist.innerHTML = '';
    SUBJECT_CATALOG.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub.name;
        datalist.appendChild(option);
    });
}

// --- MODAL FUNCTIONS (Legacy wrap for Add Subject) ---

function openAddSubjectModal() {
    const studentYear = document.getElementById('academicYearFilter').value;
    const modalYearSelect = document.getElementById('modalStudentYear');
    if (studentYear) {
        modalYearSelect.value = studentYear;
    } else {
        modalYearSelect.value = "";
    }
    handleModalYearChange();
    populateSubjectDatalist(); // Populate choices
    document.getElementById('addSubjectModal').style.display = 'flex';
}

function handleModalYearChange() {
    const studentYear = document.getElementById('modalStudentYear').value;
    const semSelect = document.getElementById('modalSemester');
    semSelect.innerHTML = '<option value="">Select Semester</option>';

    const year = academicYearMapping[studentYear];
    if (year && subjectDataMap[year]) {
        subjectDataMap[year].semesters.forEach(sem => {
            const opt = document.createElement('option');
            opt.value = sem;
            opt.textContent = `Semester ${sem}`;
            semSelect.appendChild(opt);
        });
    }
}

async function handleAddSubject(e) {
    e.preventDefault();
    const form = e.target;
    const studentYear = document.getElementById('modalStudentYear').value;
    const mSemester = document.getElementById('modalSemester').value;
    const mName = document.getElementById('manualName').value;
    const mCode = document.getElementById('manualCode').value;

    if (!studentYear || !mSemester || !mName || !mCode) {
        alert("All fields are required.");
        return;
    }

    const academicYear = academicYearMapping[studentYear];
    const token = getAuthToken();
    const data = {
        name: mName,
        code: mCode,
        credits: 3,
        department: 'IT',
        year: studentYear,
        semester: mSemester,
        academicYear: academicYear
    };

    try {
        const res = await fetch(`${BASE_API}/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('Subject created successfully!');
            form.reset();
            document.getElementById('addSubjectModal').style.display = 'none';
            loadSubjects();
        } else {
            const err = await res.json();
            alert('Error: ' + (err.message || 'Failed to create subject'));
        }
    } catch (err) {
        console.error(err);
        alert('Failed to create subject.');
    }
}

function openDeleteModal(event, id) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    subjectToDeleteId = id;
    document.getElementById('deleteSubjectModal').style.display = 'flex';
}

async function confirmDeleteSubject() {
    if (!subjectToDeleteId) return;

    try {
        console.log('Attempting to delete subject:', subjectToDeleteId);
        const token = getAuthToken();
        const res = await fetch(`${BASE_API}/subjects/${subjectToDeleteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (res.ok) {
            console.log('Delete successful:', data);
            alert('Subject deleted successfully');
            document.getElementById('deleteSubjectModal').style.display = 'none';
            subjectToDeleteId = null;
            loadSubjects();
        } else {
            console.error('Delete failed:', data);
            alert('Error deleting subject: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error("Delete Error:", error);
        alert('Failed to delete subject. See console for details.');
    }
}

function checkAuth() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'hod' && user.role !== 'admin') {
        alert('Unauthorized Access');
        window.location.href = '../index.html';
        return;
    }

    const userNameEl = document.getElementById('userName');
    const userProfileEl = document.getElementById('userProfile');
    const userDetailsEl = document.getElementById('userDetails');

    const firstName = user.name ? user.name.split(' ')[0] : 'HOD';
    if (userNameEl) userNameEl.innerText = `Hello, ${firstName}`;
    if (userProfileEl) userProfileEl.style.display = 'flex';
    if (userDetailsEl) {
        const badge = document.querySelector('.role-badge-mini');
        if (badge) {
            badge.textContent = 'HOD';
        }
        userDetailsEl.innerHTML = `
            <strong style="font-size: 1rem; color: var(--text-dark);">${user.name || 'User'}</strong>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; margin-left: 6px;">(ID: ${user.employeeId || user.rollNumber || user.identifier || 'N/A'})</span>
        `;
    }
}

// Explicitly expose functions to window for inline onclick handlers
window.openDeleteModal = openDeleteModal;
window.confirmDeleteSubject = confirmDeleteSubject;
window.unassignTeacher = unassignTeacher;
window.openTeacherExpertiseModalForSubject = openTeacherExpertiseModalForSubject;
window.openAddSubjectModal = openAddSubjectModal;
window.handleAddSubject = handleAddSubject;
window.handleSubjectNameInput = handleSubjectNameInput;
window.handleAssignTeacher = (e) => { e.preventDefault(); /* Legacy/stub if needed or actual function? Logic seems embedded in modal */ };
