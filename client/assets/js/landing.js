document.addEventListener('DOMContentLoaded', async () => {
    // Load Public Notices
    const noticeContainer = document.getElementById('public-notice-list');

    if (noticeContainer) {
        try {
            const res = await fetch('http://localhost:5000/api/notices/public');
            const notices = await res.json();

            if (notices.length === 0) {
                noticeContainer.innerHTML = '<p style="text-align:center;">No recent public notices.</p>';
                return;
            }

            let html = '';
            notices.forEach(n => {
                const date = new Date(n.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                html += `
                <div class="notice-item">
                    <div class="notice-date">
                        ${date.split(' ')[1]}<br><span style="font-size:1.2rem;">${date.split(' ')[0]}</span>
                    </div>
                    <div class="notice-content">
                        <strong>${n.title}</strong>
                        <span>${n.content}</span>
                    </div>
                </div>`;
            });
            noticeContainer.innerHTML = html;

        } catch (error) {
            console.error(error);
            noticeContainer.innerHTML = '<p style="text-align:center; color:red;">Failed to load notices.</p>';
        }
    }

    // Animate Blobs or Interactivity if needed
});
