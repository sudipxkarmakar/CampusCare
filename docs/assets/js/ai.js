const AI_ACTIONS = {
    PREFILL_COMPLAINT: "PREFILL_COMPLAINT",
    REDIRECT_ASSIGNMENT: "REDIRECT_ASSIGNMENT",
    OPEN_LEAVE_MODAL: "OPEN_LEAVE_MODAL",
    TRIGGER_SOS: "TRIGGER_SOS",
    AI_RESPONSE: "AI_RESPONSE",
    ACTION_SUCCESS: "ACTION_SUCCESS"
};

// Generate UUID for Conversation State
function getOrCreateConversationId() {
    let cid = sessionStorage.getItem('ai_conversation_id');
    if (!cid) {
        cid = crypto.randomUUID ? crypto.randomUUID() : 'cid-' + Date.now();
        sessionStorage.setItem('ai_conversation_id', cid);
    }
    return cid;
}

// Manage frontend history
function getAIHistory() {
    const histStr = sessionStorage.getItem('ai_chat_history');
    return histStr ? JSON.parse(histStr) : [];
}

function appendToAIHistory(role, text) {
    const history = getAIHistory();
    history.push({ role, parts: [{ text }] });
    
    // Trim history to prevent token explosion
    const MAX_HISTORY = 20;
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }
    
    sessionStorage.setItem('ai_chat_history', JSON.stringify(history));
}

function escapeHtml(str = "") {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function askAI() {
    const inputEl = document.getElementById('ai-input');
    const historyEl = document.getElementById('ai-chat-history');
    const text = inputEl.value.trim();

    if (!text) return;

    // UI Updates
    historyEl.style.display = 'block';
    const safeUserText = escapeHtml(text);
    historyEl.innerHTML += `<div style="margin: 5px 0; text-align: right;"><span style="background: #e2e8f0; padding: 5px 10px; border-radius: 10px; display: inline-block;">${safeUserText}</span></div>`;
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

        const conversationId = getOrCreateConversationId();
        const history = getAIHistory();

        const response = await fetch((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api/ai/chat', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ text, conversationId, history })
        });

        // Add user text to local history
        appendToAIHistory('user', text);

        const data = await response.json();
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) loadingEl.remove();

        const resObj = data.response;
        let responseMessage = resObj.message || "Processed successfully.";
        const rawMessage = responseMessage; // Keep raw for history
        const actionType = resObj.action;
        
        // Add RAW AI response to local history to avoid HTML pollution
        appendToAIHistory('model', rawMessage);
        
        responseMessage = escapeHtml(responseMessage);
        
        // Simple Markdown parsing for Gemini's output
        if (typeof responseMessage === 'string') {
            responseMessage = responseMessage
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
        }

        // Handle specific Agentic Actions
        if (actionType === AI_ACTIONS.PREFILL_COMPLAINT && resObj.payload) {
            sessionStorage.setItem('aiDraftTitle', resObj.payload.title);
            sessionStorage.setItem('aiDraftDesc', resObj.payload.description);
            responseMessage += "<br><br><i>Redirecting you to the complaint form...</i>";
            setTimeout(() => {
                if (window.location.pathname.includes('/complaints/')) {
                    window.location.reload();
                } else {
                    window.location.href = (window.location.pathname.includes('/student/') || window.location.pathname.includes('/teacher/') || window.location.pathname.includes('/hostel/')) ? '../complaints/index.html' : 'complaints/index.html';
                }
            }, 2000);
        } else if (actionType === AI_ACTIONS.TRIGGER_SOS) {
            responseMessage = `<strong style="color:#ef4444;">EMERGENCY DETECTED:</strong> ${responseMessage}`;
            setTimeout(() => {
                toggleModal('ai-modal');
                toggleModal('sos-modal');
            }, 1000);
        } else if (actionType === AI_ACTIONS.REDIRECT_ASSIGNMENT && resObj.payload) {
            sessionStorage.setItem('aiDraftAssignment', JSON.stringify(resObj.payload));
            responseMessage += "<br><br><i>Redirecting you to the assignment creation form...</i>";
            // For now, this is a placeholder redirect, assumes a specific route exists
            setTimeout(() => {
                if (window.location.pathname.includes('/teacher/')) {
                    window.location.href = 'assignments.html';
                }
            }, 2000);
        }

        // Show AI Response
        // Different colors based on response type (UX Enhancement)
        let bgColor = '#667eea';
        if (resObj.type === 'CONFIRMATION') bgColor = '#f59e0b';
        if (resObj.type === 'SUCCESS') bgColor = '#10b981';
        if (resObj.type === 'WARNING' || resObj.type === 'ERROR') bgColor = '#ef4444';

        let aiHtml = `<div style="margin: 5px 0; text-align: left;"><span style="background: ${bgColor}; color: white; padding: 10px; border-radius: 10px; display: inline-block; max-width: 80%; line-height: 1.4;">${responseMessage}</span>`;

        if (resObj.draft) {
            aiHtml += `<pre style="background: #f1f5f9; color: #333; padding: 10px; border-radius: 5px; margin-top: 5px; font-size: 0.85rem; white-space: pre-wrap;">${resObj.draft}</pre>`;
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
