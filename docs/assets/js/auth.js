const loginForm = document.getElementById('loginForm');
const toggleRegister = document.getElementById('toggleRegister');
let isRegistering = false;

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;

        if (isRegistering) {
            const name = document.getElementById('name').value;
            const role = document.getElementById('role').value;

            // Basic Validation
            const studentRegex = /^\d{11}$/;
            const teacherRegex = /^T\d{11}$/;
            const hostelerRegex = /^H\d{11}$/;

            if (role === 'student' && !studentRegex.test(identifier)) {
                alert('Student Roll Number must be exactly 11 digits (e.g. 10900120001)');
                return;
            }
            if (role === 'teacher' && !teacherRegex.test(identifier)) {
                alert('Teacher ID must be "T" followed by 11 digits (e.g. T10900120001)');
                return;
            }
            if (role === 'hosteler' && !hostelerRegex.test(identifier)) {
                alert('Hosteler ID must be "H" followed by 11 digits (e.g. H10900120001)');
                return;
            }

            const regData = {
                name,
                email: identifier.includes('@') ? identifier : `${identifier.toLowerCase()}@campus.com`, // Auto-email if not provided
                password,
                role,
                // Assign identifier based on role
                ...(role === 'student' || role === 'hosteler' ? { rollNumber: identifier } : { employeeId: identifier })
            };

            try {
                const result = await api.post('/auth/register', regData);
                if (result.token) {
                    localStorage.setItem('user', JSON.stringify(result));
                    window.location.href = 'index.html';
                } else {
                    alert(result.message || 'Registration Failed');
                }
            } catch (error) {
                console.error(error);
                alert('Registration Error: ' + error.message);
            }
            return;
        }

        const data = { identifier, password };

        try {
            const result = await api.post('/auth/login', data);

            if (result.token) {
                // Success
                localStorage.setItem('user', JSON.stringify(result));
                // alert(`Welcome ${result.name}!`);

                // Redirect to Home Page (Always)
                window.location.href = 'index.html';
            } else {
                alert(result.message || 'Login Failed');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        }
    });

    toggleRegister.addEventListener('click', () => {
        isRegistering = !isRegistering;
        apiRegisterLogic(); // Toggle UI
    });
}

function apiRegisterLogic() {
    const title = document.querySelector('.login-header h2');
    const submitBtn = document.querySelector('.btn-submit');

    if (isRegistering) {
        title.innerText = "Create Account";
        submitBtn.innerText = "Register";
        document.getElementById('toggleRegister').innerText = "Already have an account? Login";
        // Ideally add Name field here dynamically
        const nameField = document.createElement('div');
        nameField.className = 'form-group';
        nameField.id = 'name-group';
        nameField.innerHTML = `
            <div style="margin-bottom:10px;">
                <label>Full Name</label>
                <input type="text" id="name" class="form-control" placeholder="John Doe">
            </div>
            <div>
                <label>I am a...</label>
                <select id="role" class="form-control" style="background:white;">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="hosteler">Hosteler</option>
                </select>
            </div>
        `;
        loginForm.insertBefore(nameField, loginForm.querySelector('.form-group')); // Insert at top?
    } else {
        title.innerText = "Welcome Back";
        submitBtn.innerText = "Login";
        document.getElementById('toggleRegister').innerText = "New here? Register";
        const nameGroup = document.getElementById('name-group');
        if (nameGroup) nameGroup.remove();
    }
}
