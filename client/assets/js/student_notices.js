document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('notices-container');
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');

    // Update page title if filtering
    if (filter === 'personal') {
        document.querySelector('.page-title').textContent = 'Personal Notices';
    }

    try {
        // Fetch public notices first (or all notices if we had a unified endpoint)
        // For now, using the public notices endpoint and simulating "personal" ones if mock mode
        const response = await fetch(`${API_BASE_URL}/notices/public`);
        const notices = await response.json();

        container.innerHTML = '';

        if (filter === 'personal') {
            // Mock Personal Notices (since backend might not have this fully separated yet)
            const personalNotices = [
                { title: 'Meeting with HOD', date: new Date(), content: 'Please report to the HOD office at 2 PM tomorrow regarding your project.' },
                { title: 'Library Book Overdue', date: new Date(Date.now() - 86400000), content: 'The book "Intro to Algorithms" is overdue. Please return it.' }
            ];

            personalNotices.forEach(notice => {
                const card = createNoticeCard(notice, true);
                container.appendChild(card);
            });

            if (personalNotices.length === 0) {
                container.innerHTML = '<p style="text-align:center;">No personal notices.</p>';
            }

        } else {
            // Display Public Notices
            if (notices.length === 0) {
                container.innerHTML = '<p style="text-align:center;">No active notices.</p>';
                return;
            }
            notices.forEach(notice => {
                const card = createNoticeCard(notice);
                container.appendChild(card);
            });
        }

    } catch (error) {
        console.error('Error fetching notices:', error);
        container.innerHTML = '<p style="text-align:center; color:red;">Failed to load notices.</p>';
    }
});

function createNoticeCard(notice, isPersonal = false) {
    const div = document.createElement('div');
    div.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    div.style.padding = '1rem 0';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'start'; // Align items to the start
    div.style.flexDirection = 'column'; // Stack elements vertically on small screens if needed

    const date = new Date(notice.date || notice.createdAt).toLocaleDateString();

    div.innerHTML = `
        <div style="flex: 1;">
            <div style="display:flex; align-items:center; margin-bottom:0.5rem;">
                ${isPersonal ? '<span style="background:#f59e0b; color:white; font-size:0.7rem; padding:2px 6px; border-radius:4px; margin-right:8px;">PERSONAL</span>' : ''}
                <h3 style="margin:0; font-size:1.1rem; color:#f1f5f9;">${notice.title}</h3>
            </div>
            <p style="margin:0.5rem 0 0; color:#cbd5e1; font-size:0.95rem;">${notice.content}</p>
        </div>
        <div style="font-size:0.85rem; color:#94a3b8; margin-top:0.5rem; align-self: flex-start;">
            <i class="fa-regular fa-clock"></i> ${date}
        </div>
    `;
    return div;
}
