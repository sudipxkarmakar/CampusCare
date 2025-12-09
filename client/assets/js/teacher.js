// Check Auth
const userStr = localStorage.getItem('user');
if (!userStr) {
    window.location.href = '../login.html';
}

const user = JSON.parse(userStr);

if (user.role !== 'teacher' && user.role !== 'hod') {
    alert("Access Denied: Teachers Only");
    window.location.href = '../index.html';
}

// UI Setup
document.addEventListener('DOMContentLoaded', () => {
    // Hero Greeting
    const heroSub = document.querySelector('.hero-sub');
    if (heroSub) heroSub.innerText = `Welcome, ${user.name} (${user.department})`;

    // Form Listener
    const assignmentForm = document.getElementById('assignmentForm');
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const data = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                subject: document.getElementById('subject').value,
                department: document.getElementById('department').value,
                batch: document.getElementById('batch').value,
                section: document.getElementById('section').value,
                deadline: document.getElementById('deadline').value,
                teacherId: user._id
            };

            try {
                const res = await api.post('/assignments', data);
                if (res._id) {
                    alert('Assignment Created Successfully!');
                    assignmentForm.reset();
                } else {
                    alert('Error: ' + res.message);
                }
            } catch (err) {
                console.error(err);
                alert('Failed to create assignment');
            }
        });
    }
});
