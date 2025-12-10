const loginForm = document.getElementById('loginForm');
const toggleRegister = document.getElementById('toggleRegister');
let isRegistering = false;

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;

        if (isRegistering) {
            // Registration Logic
            // For MVP, we assume Role is 'student' if using Roll Format, else need a selector?
            // Let's keep it simple: Login checks if User exists. 
            // If Registering, we need Name and Role. 
            // For now, let's just handle Login as the primary flow and maybe Register is creating a student?

            // To properly register, we need Name. Let's redirect or prompt?
            // For this demo, let's assume auto-registration on Login using the "Single Key" if user not found?
            // No, the Plan says "Auth: Simple login".

            // Let's implement a simple Register Alert
            alert("Registration is restricted to Admin import for now. Please Login with 'CSE-2025-001' and 'password'.");
            return;
        }

        const data = { identifier, password };

        try {
            const result = await api.post('/auth/login', data);

            if (result.token) {
                // Success
                localStorage.setItem('user', JSON.stringify(result));
                // alert(`Welcome ${result.name}!`);

                // Redirect based on Role
                if (result.role === 'student') {
                    window.location.href = 'student/index.html';
                } else if (result.role === 'teacher') {
                    window.location.href = 'teacher/index.html';
                } else if (result.role === 'hod') {
                    window.location.href = 'teacher/index.html'; // Or specific HOD dashboard
                } else {
                    window.location.href = 'index.html';
                }
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
        nameField.innerHTML = `<label>Full Name</label><input type="text" id="name" class="form-control" placeholder="John Doe">`;
        loginForm.insertBefore(nameField, loginForm.querySelector('.form-group')); // Insert at top?
    } else {
        title.innerText = "Welcome Back";
        submitBtn.innerText = "Login";
        document.getElementById('toggleRegister').innerText = "New here? Register";
        const nameGroup = document.getElementById('name-group');
        if (nameGroup) nameGroup.remove();
    }
}
