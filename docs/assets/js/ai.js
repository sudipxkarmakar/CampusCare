async function askAI() {
    const inputEl = document.getElementById('ai-input');
    const historyEl = document.getElementById('ai-chat-history');
    const text = inputEl.value.trim();

    if (!text) return;

    // UI Updates
    historyEl.style.display = 'block';
    historyEl.innerHTML += `<div style="margin: 5px 0; text-align: right;"><span style="background: #e2e8f0; padding: 5px 10px; border-radius: 10px; display: inline-block;">${text}</span></div>`;
    inputEl.value = '';

    // Loading State
    const loadingId = 'loading-' + Date.now();
    historyEl.innerHTML += `<div id="${loadingId}" style="margin: 5px 0; text-align: left;"><span style="color: #666; font-style: italic;">AI is thinking...</span></div>`;
    historyEl.scrollTop = historyEl.scrollHeight;

    try {
        const userStr = localStorage.getItem('user');
        let token = '';
        if (userStr) {
            const user = JSON.parse(userStr);
            token = user.token || localStorage.getItem('token');
        }

        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:5000/api/ai/chat', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        let responseMessage = data.response.message || data.response;
        
        // Simple Markdown parsing for Gemini's output
        if (typeof responseMessage === 'string') {
            responseMessage = responseMessage
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
        }

        // Handle specific Agentic Actions
        if (data.response.action === "REDIRECT_TO_COMPLAINT" && data.response.data) {
            sessionStorage.setItem('aiDraftTitle', data.response.data.title);
            sessionStorage.setItem('aiDraftDesc', data.response.data.description);
            responseMessage += "<br><br><i>Redirecting you to the complaint form...</i>";
            setTimeout(() => {
                // Determine path relative to root or subfolder
                if (window.location.pathname.includes('/complaints/')) {
                    window.location.reload();
                } else {
                    window.location.href = (window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/') || window.location.pathname.includes('/hostel/')) ? '../complaints/index.html' : 'complaints/index.html';
                }
            }, 2000);
        } else if (data.response.action === "TRIGGER_SOS") {
            responseMessage = `<strong style="color:#ef4444;">EMERGENCY DETECTED:</strong> ${responseMessage}`;
            setTimeout(() => {
                toggleModal('ai-modal');
                toggleModal('sos-modal');
            }, 1000);
        }

        // Show AI Response
        let aiHtml = `<div style="margin: 5px 0; text-align: left;"><span style="background: #667eea; color: white; padding: 10px; border-radius: 10px; display: inline-block; max-width: 80%; line-height: 1.4;">${responseMessage}</span>`;

        if (data.response.draft) {
            aiHtml += `<pre style="background: #f1f5f9; color: #333; padding: 10px; border-radius: 5px; margin-top: 5px; font-size: 0.85rem; white-space: pre-wrap;">${data.response.draft}</pre>`;
        }

        aiHtml += `</div>`;
        historyEl.innerHTML += aiHtml;

    } catch (error) {
        console.error(error);
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();
        historyEl.innerHTML += `<div style="margin: 5px 0; text-align: left;"><span style="color: red;">Error: ${error.message}</span></div>`;
    }

    historyEl.scrollTop = historyEl.scrollHeight;
}
