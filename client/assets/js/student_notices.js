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
        // Mock fallback
        container.innerHTML = '';
        const mockNotices = [
            { title: 'Exam Schedule Released', content: 'The final semester exam schedule is now available on the portal.', date: new Date() },
            { title: 'Holiday Announcement', content: 'Campus will remain closed on Friday for National Holiday.', date: new Date() },
            { title: 'Guest Lecture', content: 'Dr. APJ Abdul Kalam Memorial Lecture starts at 10 AM in the Auditorium.', date: new Date() }
        ];
        mockNotices.forEach(n => container.appendChild(createNoticeCard(n)));
    }
});

function createNoticeCard(notice, isPersonal = false) {
    const div = document.createElement('div');
    // Using list-row-hover class for standard hover effect
    div.className = 'list-row-hover';
    div.style.padding = '1rem';
    div.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
    div.style.borderRadius = '10px';
    div.style.marginBottom = '1rem';
    div.style.transition = '0.3s';
    div.style.cursor = 'pointer';

    const date = new Date(notice.date || notice.createdAt).toLocaleDateString();

    div.onclick = function () {
        // Simulate opening PDF
        const pdfName = notice.title.replace(/\s+/g, '_') + '.pdf';
        alert(`Opening ${pdfName}...`);
        // Ideally: window.open(notice.pdfUrl || '#', '_blank');
    };

    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
                <div style="display:flex; align-items:center; margin-bottom:0.5rem;">
                    ${isPersonal ? '<span style="background:#f59e0b; color:white; font-size:0.7rem; padding:2px 6px; border-radius:4px; margin-right:8px;">PERSONAL</span>' : ''}
                    <h3 style="margin:0; font-size:1.1rem; color:#1f2937; font-weight: 700;">${notice.title}</h3>
                </div>
                <p style="margin:0.5rem 0 0; color:#4a5568; font-size:0.95rem;">${notice.content}</p>
                <div style="margin-top:0.5rem; font-size: 0.8rem; color:#3b82f6; font-weight: 500;">
                    <i class="fa-solid fa-file-pdf"></i> Click to view full notice (PDF)
                </div>
            </div>
            <div style="font-size:0.85rem; color:#000000; font-weight: 500; white-space: nowrap; margin-left: 1rem;">
                <i class="fa-regular fa-clock"></i> ${date}
            </div>
        </div>
    `;
    return div;
}
