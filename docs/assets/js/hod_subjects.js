// HOD Subject Allocation Logic

const BASE_API = 'http://localhost:5000/api';

const yearMapping = {
    "2026": "4th Year",
    "2027": "3rd Year",
    "2028": "2nd Year",
    "2029": "1st Year"
};

// --- CENTRALIZED EVENT DELEGATION ---

document.addEventListener("click", (e) => {
    // 1. Assign Teacher Icon (REMOVED - Kept case if needed later, but actively removed from UI)
    const assignBtn = e.target.closest(".assign-teacher-btn");
    if (assignBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = assignBtn.dataset.id;
        const code = assignBtn.dataset.code;
        const name = assignBtn.dataset.name;
        const year = assignBtn.dataset.academicYear;
        // openAssignTeacherModal(id, code, name, year); // OLD MODAL
        return;
    }

    // NEW: Reverse Assign Button - Delegated Handler
    const reverseAssignBtn = e.target.closest(".reverse-assign-btn");
    if (reverseAssignBtn) {
        e.preventDefault();
        e.stopPropagation(); // Good practice to prevent bubbling if it's nested
        const teacherId = reverseAssignBtn.dataset.id;
        const teacherName = reverseAssignBtn.dataset.name;

        if (teacherId && teacherName) {
            openReverseAssignModal(teacherId, teacherName);
        } else {
            console.error("Missing data on assign button", reverseAssignBtn);
        }
        return;
    }


    // 2. Delete Subject Icon
    const deleteBtn = e.target.closest(".delete-subject-btn");
    if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();

        const id = deleteBtn.dataset.id;

        openDeleteModal(id);
        return;
    }

    // 3. Add Subject Button (Main Header)
    if (e.target.closest(".add-subject-btn")) {
        e.preventDefault();
        openAddSubjectModal();
        return;
    }

    // 4. View Expertise Button
    if (e.target.closest(".view-expertise-btn")) {
        e.preventDefault();
        openTeacherExpertiseModal();
        return;
    }

    // 5. Modal Close Buttons
    const closeBtn = e.target.closest(".close-modal-btn");
    if (closeBtn) {
        e.preventDefault();
        const modalId = closeBtn.dataset.modal;
        if (modalId) {
            document.getElementById(modalId).style.display = 'none';
            // Reset state if needed
            if (modalId === 'deleteSubjectModal') subjectToDeleteId = null;
        }
        return;
    }

    // 6. Close Modal when clicking outside
    if (e.target.classList.contains('modal')) {

        e.target.style.display = "none";
        // Reset specific states
        if (e.target.id === 'deleteSubjectModal') subjectToDeleteId = null;
    }
});

// --- LOAD DATA ---

document.addEventListener('DOMContentLoaded', () => {
    const yearSelect = document.getElementById('academicYearFilter');
    if (yearSelect) {
        yearSelect.value = "2026";
        handleMainYearChange();
    }
});

async function loadSubjects() {
    const year = document.getElementById('academicYearFilter').value;
    const semester = document.getElementById('semesterFilter').value;
    if (!year) return;

    const listDiv = document.getElementById('subjectList');
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');

    listDiv.innerHTML = '';
    listDiv.style.display = 'none';
    loading.style.display = 'block';
    empty.style.display = 'none';

    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
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

        const finalSubjects = subjects.filter(sub => {
            if (semester && semester !== 'all') {
                return sub.semester == semester;
            }
            return true;
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
    const year = document.getElementById('academicYearFilter').value;
    const semSelect = document.getElementById('semesterFilter');
    const currentSem = semSelect.value;

    semSelect.innerHTML = '<option value="all">All Semesters</option>';

    if (subjectDataMap[year]) {
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
    if (!subject._id) {
        console.error("Subject missing ID:", subject);
    }

    const div = document.createElement('div');
    div.className = 'subject-card';
    div.style.position = 'relative';

    let teacherNames = "No teacher assigned";
    if (subject.teachers && subject.teachers.length > 0) {
        teacherNames = subject.teachers.map(t => t.name).join(', ');
    }

    // Details Section
    const detailsDiv = document.createElement('div');
    detailsDiv.innerHTML = `
        <h3 style="color:#2d3748; margin-bottom:5px;">${subject.name}</h3>
        <div style="font-size:0.9rem; color:#64748b; font-weight:600;">${subject.code}</div>
        <div style="font-size:0.85rem; color:#94a3b8; margin-top:5px;">
            ${subject.year} | Sem ${subject.semester}
        </div>
        <div style="font-size:0.85rem; color:#3b82f6; margin-top:8px; font-weight:500;">
            <i class="fa-solid fa-chalkboard-user"></i> ${teacherNames}
        </div>
    `;

    div.appendChild(detailsDiv);

    return div;
}

// --- DATA MAPPING ---

const subjectDataMap = {
    "2026": { semesters: [7, 8] },
    "2027": { semesters: [5, 6] },
    "2028": { semesters: [3, 4] },
    "2029": { semesters: [1, 2] }
};

// --- MODAL FUNCTIONS (Now called by delegation) ---

function openAddSubjectModal() {
    const year = document.getElementById('academicYearFilter').value;
    if (!year) {
        alert("Please select an academic year first.");
        return;
    }
    const modalYearSelect = document.getElementById('modalAcademicYear');
    modalYearSelect.value = year;
    handleModalYearChange();
    document.getElementById('addSubjectModal').style.display = 'block';
}

function handleModalYearChange() {
    const selectedYear = document.getElementById('modalAcademicYear').value;
    const studentYear = yearMapping[selectedYear];
    const yearSelect = document.querySelector('select[name="year"]');

    if (studentYear && yearSelect) {
        yearSelect.value = studentYear;
    }
    updateSemesterOptions(selectedYear);
}

function updateSemesterOptions(academicYear) {
    const semSelect = document.getElementById('modalSemester');
    semSelect.innerHTML = '<option value="">Select Semester</option>';

    if (subjectDataMap[academicYear]) {
        subjectDataMap[academicYear].semesters.forEach(sem => {
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
    // ... rest of logic remains same, form submission is handled by onsubmit in HTML or could be delegated too
    // User only asked to fix icons/modals interaction, I will keep standard form submission unless it breaks
    const academicYear = document.getElementById('modalAcademicYear').value;
    const mName = document.getElementById('manualName').value;
    const mCode = document.getElementById('manualCode').value;

    if (!mName || !mCode) {
        alert("Subject Name and Code are required.");
        return;
    }

    const token = localStorage.getItem('token');
    const data = {
        name: mName,
        code: mCode,
        credits: 3,
        department: 'IT',
        year: form.year.value,
        semester: form.semester.value,
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

// --- REVERSE ASSIGNMENT (Teacher -> Subject) ---

async function openReverseAssignModal(teacherId, teacherName) {
    console.log(`[UI] Opening Reverse Assign Modal for ${teacherName}`);

    // Set UI elements
    document.getElementById('assignTeacherNameDisplay').textContent = `Assigning Subject for: ${teacherName}`;
    document.getElementById('assignTeacherId').value = teacherId;

    // Get current global filters
    const year = document.getElementById('academicYearFilter').value;
    document.getElementById('assignAcademicYear').value = year;

    const modal = document.getElementById('assignTeacherModal');
    modal.style.display = 'block';

    // Populate Subjects
    const select = document.getElementById('assignSubjectSelect');
    await loadSubjectsForAssignment(select, year);
}

async function loadSubjectsForAssignment(selectElement, year) {
    selectElement.innerHTML = '<option value="">Loading subjects...</option>';
    try {
        const token = localStorage.getItem('token');
        const dept = 'IT'; // Hardcoded for this workflow as per previous pattern

        // Fetch all subjects for this year (no semester filter)
        const res = await fetch(`${BASE_API}/subjects?dept=${dept}&academicYear=${year}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const subjects = await res.json();

        selectElement.innerHTML = '<option value="">Select a Subject</option>';

        if (subjects.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.textContent = "No subjects found for this year";
            selectElement.appendChild(opt);
            return;
        }

        subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub._id;
            // Store code in dataset if needed, but backend often needs ID. 
            // We'll pass code via lookup or just rely on ID if backend supports it.
            // Current backend expect subjectCode too. We'll attach it to option.
            opt.dataset.code = sub.code;
            opt.textContent = `${sub.name} (${sub.code}) - Sem ${sub.semester}`;
            selectElement.appendChild(opt);
        });

    } catch (err) {
        console.error(err);
        selectElement.innerHTML = '<option value="">Error loading subjects</option>';
    }
}

async function handleAssignTeacher(e) {
    e.preventDefault();
    const form = e.target;

    const teacherId = form.teacherId.value;
    const academicYear = form.academicYear.value;

    // Get Subject Details from Select
    const subjectSelect = document.getElementById('assignSubjectSelect');
    const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];

    if (!subjectSelect.value) {
        alert("Please select a subject.");
        return;
    }

    const subjectId = subjectSelect.value;
    const subjectCode = selectedOption.dataset.code;

    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${BASE_API}/subjects/assign-teacher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ subjectId, subjectCode, teacherId, academicYear })
        });

        if (res.ok) {
            alert('Teacher assigned successfully!');
            document.getElementById('assignTeacherModal').style.display = 'none';
            // Reload subjects to reflect changes on cards (if visible)
            loadSubjects();
        } else {
            const err = await res.json();
            alert('Error: ' + err.message);
        }
    } catch (err) {
        console.error(err);
        alert('Failed to assign teacher');
    }
}

// --- TEACHER EXPERTISE ---

async function openTeacherExpertiseModal() {
    document.getElementById('teacherExpertiseModal').style.display = 'block';
    await loadTeacherExpertise();
}

async function loadTeacherExpertise() {
    const listBody = document.getElementById('teacherExpertiseList');
    listBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        const dept = user.department || 'IT';
        const res = await fetch(`${BASE_API}/admin/dept/${dept}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await res.json();
        const teachers = users.filter(u => u.role === 'teacher');

        listBody.innerHTML = '';
        if (teachers.length === 0) {
            listBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No teachers found.</td></tr>';
            return;
        }

        teachers.forEach(t => {
            const tr = document.createElement('tr');

            // Name
            const tdName = document.createElement('td');
            tdName.style.padding = '12px';
            tdName.style.fontWeight = '500';
            tdName.textContent = t.name;

            // Designation
            const tdDesig = document.createElement('td');
            tdDesig.style.padding = '12px';
            tdDesig.style.color = '#64748b';
            tdDesig.textContent = t.designation || 'Faculty';

            // Expertise
            const tdExp = document.createElement('td');
            tdExp.style.padding = '12px';
            tdExp.textContent = (t.expertise || []).join(', ') || t.specialization || '-';

            // Action (Button)
            const tdAction = document.createElement('td');
            tdAction.style.padding = '12px';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'reverse-assign-btn'; // Keeping class for styling if needed, but logic is direct
            btn.textContent = 'Assign';
            btn.style.cssText = "background:#3b82f6; color:white; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.85rem;";

            btn.dataset.id = t._id;
            btn.dataset.name = t.name;

            // REMOVED: Direct Event Listener - Handled by global delegation now

            tdAction.appendChild(btn);

            tr.appendChild(tdName);
            tr.appendChild(tdDesig);
            tr.appendChild(tdExp);
            tr.appendChild(tdAction);

            listBody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        listBody.innerHTML = '<tr><td colspan="4" style="color:red;">Failed to load.</td></tr>';
    }
}

// --- DELETE SUBJECT ---

let subjectToDeleteId = null;

function openDeleteModal(id) {
    subjectToDeleteId = id;
    document.getElementById('deleteSubjectModal').style.display = 'block';
}

async function confirmDeleteSubject() {
    if (!subjectToDeleteId) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_API}/subjects/${subjectToDeleteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {

            alert('Subject deleted successfully');
            document.getElementById('deleteSubjectModal').style.display = 'none';
            subjectToDeleteId = null;
            loadSubjects();
        } else {
            const err = await res.json();
            alert('Error deleting subject: ' + err.message);
        }
    } catch (error) {
        console.error("Delete Error:", error);
        alert('Failed to delete subject.');
    }
}

