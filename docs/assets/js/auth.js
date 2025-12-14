const loginForm = document.getElementById('loginForm');
const toggleRegister = document.getElementById('toggleRegister');
const roleSelect = document.getElementById('role');
const idLabel = document.getElementById('idLabel');
const identifierInput = document.getElementById('identifier');
const idHelp = document.getElementById('idHelp');
const nameGroup = document.getElementById('nameGroup');
const registerExtras = document.getElementById('registerExtras'); // New container

// Helper references for extras
const deptGroup = document.getElementById('deptGroup');
const batchGroup = document.getElementById('batchGroup');
const sectionGroup = document.getElementById('sectionGroup');
const hostelFields = document.getElementById('hostelFields'); // Hosteler Fields

let isRegistering = false;

// UI Configuration Map
const roleConfig = {
    student: {
        label: 'Roll Number',
        placeholder: 'Enter 11-digit Roll Number',
        regex: /^\d{11}$/,
        error: 'Roll Number must be exactly 11 digits (Numbers only).',
        extras: ['dept', 'batch', 'section']
    },
    teacher: {
        label: 'Employee ID',
        placeholder: 'Enter Employee ID (TXXXXXXXXXXX)',
        regex: /^T\d{11}$/,
        error: 'Employee ID must start with "T" followed by 11 digits.',
        extras: ['dept']
    },
    hosteler: {
        label: 'Hostel Roll Number',
        placeholder: 'Enter Hostel Roll Number (HXXXXXXXXXXX)',
        regex: /^H\d{11}$/,
        error: 'Hostel Roll Number must start with "H" followed by 11 digits.',
        extras: ['dept', 'batch', 'hostel']
    }
};

if (loginForm) {
    // 1. Initialize UI
    updateFormFields(roleSelect.value);

    // 2. Handle Role Change
    roleSelect.addEventListener('change', (e) => {
        updateFormFields(e.target.value);
        validateIdentifier();
    });

    // 3. Real-time Validation
    identifierInput.addEventListener('input', validateIdentifier);

    // 4. Handle Mode Toggle
    toggleRegister.addEventListener('click', () => {
        isRegistering = !isRegistering;
        updateModeUI();
        updateFormFields(roleSelect.value); // Re-run to show/hide extras
    });

    // 5. Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Basic ID Validation
        if (!validateIdentifier()) return;

        const role = roleSelect.value;
        const identifier = identifierInput.value;
        const password = document.getElementById('password').value;

        if (isRegistering) {
            // Registration Logic
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const department = document.getElementById('department').value;
            const batch = document.getElementById('batch').value;
            const section = document.getElementById('section').value;
            const bloodGroup = document.getElementById('bloodGroup').value;

            // Hosteler fields
            const hostelName = document.getElementById('hostelName').value;
            const roomNumber = document.getElementById('roomNumber').value;

            // Strict Validation
            // 1. Email Domain - REMOVED RESTRICTION
            if (!email) {
                alert('Email is required.');
                return;
            }

            // 2. Required Extra Fields
            if (role === 'student') {
                if (!department || !batch || !section) return alert('All fields (Dept, Batch, Section) are required for Students.');
            } else if (role === 'teacher') {
                if (!department) return alert('Department is required for Teachers.');
            } else if (role === 'hosteler') {
                if (!department || !batch) return alert('Dept and Batch are required for Hostelers.');
                if (!hostelName || !roomNumber) return alert('Hostel Name and Room Number are required.');
            }

            const regData = {
                name,
                email,
                password,
                role,
                department,
                batch: role !== 'teacher' ? batch : undefined,
                section: role === 'student' ? section : undefined,
                bloodGroup: bloodGroup, // Send for ALL roles now
                ...(role === 'student' || role === 'hosteler' ? { rollNumber: identifier } : { employeeId: identifier })
            };

            if (role === 'hosteler') {
                regData.hostelName = hostelName;
                regData.roomNumber = roomNumber;
            }

            try {
                const result = await api.post('/auth/register', regData);
                if (result.token) {
                    alert('Registration Successful! Please login with your credentials.');
                    toggleRegister.click();
                } else {
                    alert(result.message || 'Registration Failed');
                }
            } catch (error) {
                console.error(error);
                alert('Registration Error: ' + error.message);
            }
        } else {
            // Login Logic
            const department = document.getElementById('department').value;
            const data = { identifier, password, role };

            // Send Department if selected (helps resolve ambiguity)
            if (department && (role === 'student' || role === 'hosteler')) {
                data.department = department;
            }

            try {
                const result = await api.post('/auth/login', data);
                if (result.token) {
                    localStorage.setItem('user', JSON.stringify(result));
                    window.location.href = 'index.html';
                } else {
                    if (result.requiresDepartment) {
                        alert(result.message);
                        // Force show department if it wasn't visible
                        deptGroup.style.display = 'block';
                    } else {
                        alert(result.message || 'Login Failed');
                    }
                }
            } catch (error) {
                console.error(error);
                alert('An error occurred');
            }
        }
    });
}

// Update Form Fields Logic
function updateFormFields(role) {
    const config = roleConfig[role];
    if (config) {
        idLabel.innerText = config.label;
        identifierInput.placeholder = config.placeholder;
        idHelp.style.display = 'none';

        // Visibility Logic
        if (isRegistering) {
            // Register Mode: Strict rules
            deptGroup.style.display = config.extras.includes('dept') ? 'block' : 'none';
            batchGroup.style.display = config.extras.includes('batch') ? 'block' : 'none';
            sectionGroup.style.display = config.extras.includes('section') ? 'block' : 'none';

            // New Hostel Fields
            if (hostelFields) {
                hostelFields.style.display = config.extras.includes('hostel') ? 'block' : 'none';
            }

            const bgWrapper = document.getElementById('bloodGroupWrapper');
            if (bgWrapper) {
                // Now available for Student, Hosteler, AND Teacher
                bgWrapper.style.display = 'block';
            }
        } else {
            // Login Mode: Clean UI (User Request)
            deptGroup.style.display = 'none';
            batchGroup.style.display = 'none';
            sectionGroup.style.display = 'none';
            if (hostelFields) hostelFields.style.display = 'none';

            const bgWrapper = document.getElementById('bloodGroupWrapper');
            if (bgWrapper) bgWrapper.style.display = 'none';
        }
    }
}

function validateIdentifier() {
    const role = roleSelect.value;
    const value = identifierInput.value;
    const config = roleConfig[role];

    if (!value) {
        idHelp.style.display = 'none';
        return false;
    }

    if (!config.regex.test(value)) {
        idHelp.innerText = config.error;
        idHelp.style.display = 'block';
        return false;
    } else {
        idHelp.style.display = 'none';
        return true;
    }
}

function updateModeUI() {
    const title = document.querySelector('.login-header h2');
    const submitBtn = document.querySelector('.btn-submit');

    if (isRegistering) {
        title.innerText = "Create Account";
        submitBtn.innerText = "Register";
        toggleRegister.innerText = "Already have an account? Login";
        nameGroup.style.display = 'block';
        registerExtras.style.display = 'block';

        document.getElementById('name').required = true;
        document.getElementById('email').required = true;
    } else {
        title.innerText = "Welcome Back";
        submitBtn.innerText = "Login";
        toggleRegister.innerText = "New here? Register";
        nameGroup.style.display = 'none';
        registerExtras.style.display = 'none';

        document.getElementById('name').required = false;
        document.getElementById('email').required = false;
    }
}
