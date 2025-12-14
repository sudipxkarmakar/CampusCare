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
            // Fetch Personal Notices (Assuming endpoint exists or filtering from public for now if not)
            // Ideally: const response = await fetch(`${API_BASE_URL}/notices/personal`, ...);
            // Since we seeded general notices mostly, let's just show an empty state or filter if we had user ID.
            // For rigorous "No Mock", we strictly fallback to "No personal notices found" if we can't fetch them.
            container.innerHTML = '<p style="text-align:center; padding:2rem; color:#64748b;">Personal notices feature coming soon (API Integration Pending).</p>';

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
        container.innerHTML = '<p style="text-align:center; color:red; padding:2rem;">Failed to load notices. Check connection.</p>';
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
