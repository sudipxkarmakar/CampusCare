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
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        // Show AI Response
        let aiHtml = `<div style="margin: 5px 0; text-align: left;"><span style="background: #667eea; color: white; padding: 5px 10px; border-radius: 10px; display: inline-block;">${data.response.message || data.response}</span>`;

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
