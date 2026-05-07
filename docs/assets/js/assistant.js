let currentPollingController = null;
let currentEtag = null;
let conversationId = sessionStorage.getItem('ai_conversation_id');
let pollingIntervalTimer = null;

function getRequestId() {
    return crypto.randomUUID ? crypto.randomUUID() : 'req-' + Date.now();
}

function getAuthHeaders() {
    const userStr = localStorage.getItem('user');
    let token = '';
    if (userStr) {
        token = JSON.parse(userStr).token || localStorage.getItem('token');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-client-request-id': getRequestId()
    };
}

// Session Resurrection
async function initSession() {
    if (!conversationId) {
        conversationId = crypto.randomUUID ? crypto.randomUUID() : 'cid-' + Date.now();
        sessionStorage.setItem('ai_conversation_id', conversationId);
        renderState('IDLE', 'How can I help you today?');
        return;
    }
    
    // Anti-Herd Polling Initial Delay
    setTimeout(() => pollStatus(0), Math.random() * 2000);
}

// Polling Engine with Jitter
async function pollStatus(retryCount = 0) {
    if (currentPollingController) {
        currentPollingController.abort();
    }
    if (pollingIntervalTimer) {
        clearTimeout(pollingIntervalTimer);
    }
    
    // Visibility throttling
    if (document.visibilityState === 'hidden') {
        return; // Pause polling entirely while hidden
    }

    currentPollingController = new AbortController();
    const signal = currentPollingController.signal;

    try {
        if (!navigator.onLine) {
            renderState('OFFLINE', 'You are offline. Waiting for connection...');
            pollingIntervalTimer = setTimeout(() => { if(!signal.aborted) pollStatus(retryCount) }, 5000);
            return;
        }

        const headers = getAuthHeaders();
        if (currentEtag) {
            headers['If-None-Match'] = currentEtag;
        }

        // Frontend Fetch Timeout Guard (15s hard cutoff)
        const timeoutId = setTimeout(() => currentPollingController.abort(), 15000);

        const res = await fetch(`http://localhost:5000/api/ai/status/${conversationId}`, {
            headers,
            signal
        });
        clearTimeout(timeoutId);

        if (res.status === 304) {
            scheduleNextPoll(retryCount);
            return;
        }

        if (!res.ok) {
            if (res.status === 404) {
                renderState('IDLE', 'How can I help you today?');
                return;
            }
            throw new Error('Backend error');
        }

        currentEtag = res.headers.get('ETag');
        const data = await res.json();

        renderState(data.presentationState, data.message, data);

        if (["AWAITING_CONFIRMATION", "EXECUTING"].includes(data.presentationState)) {
            const baseDelay = data.presentationState === "AWAITING_CONFIRMATION" ? 3000 : 5000;
            const jitterDelay = baseDelay + Math.random() * 1000;
            pollingIntervalTimer = setTimeout(() => {
                if (!signal.aborted) pollStatus(0);
            }, jitterDelay);
        }

    } catch (err) {
        if (err.name === 'AbortError') return;
        
        // Hard Polling Ceiling
        if (retryCount >= 3) {
            renderState('FAILED', 'Connection lost. Please tap Send to retry.');
            return;
        }
        
        const backoff = retryCount === 0 ? 5000 : (retryCount === 1 ? 10000 : 20000);
        renderState('RECOVERING', `Trying to reconnect... (Retry in ${backoff/1000}s)`);
        
        pollingIntervalTimer = setTimeout(() => {
            if (!signal.aborted) pollStatus(retryCount + 1);
        }, backoff);
    }
}

function scheduleNextPoll(retryCount) {
    const jitterDelay = 4000 + Math.random() * 1000;
    pollingIntervalTimer = setTimeout(() => {
        if (currentPollingController && !currentPollingController.signal.aborted) {
            pollStatus(retryCount);
        }
    }, jitterDelay);
}

function cleanupPolling() {
    if (currentPollingController) currentPollingController.abort();
    if (pollingIntervalTimer) clearTimeout(pollingIntervalTimer);
}

// Lifecycle Hooks
window.addEventListener('beforeunload', cleanupPolling);
window.addEventListener('pagehide', cleanupPolling);

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Anti-Herd Delay on Restore
        setTimeout(() => pollStatus(0), Math.random() * 2000); 
    } else {
        cleanupPolling(); // Pause background processing
    }
});

window.addEventListener('offline', () => {
    cleanupPolling();
    renderState('OFFLINE', 'You are currently offline. Please check your connection.');
});
window.addEventListener('online', () => {
    renderState('RECOVERING', 'Connection restored. Syncing...');
    pollStatus(0);
});

// UI Rendering
function renderState(presentationState, message, fullData = null) {
    const statusDiv = document.getElementById('ai-status');
    const inputField = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const actionArea = document.getElementById('ai-action-area');

    statusDiv.textContent = message;
    
    // Visual indicators
    statusDiv.className = 'status-banner';
    if (['FAILED', 'TIMEOUT', 'CONFLICT', 'OFFLINE'].includes(presentationState)) {
        statusDiv.classList.add('error');
    } else if (['EXECUTING', 'RECOVERING', 'SENDING', 'CONFIRMING'].includes(presentationState)) {
        statusDiv.classList.add('loading');
    } else {
        statusDiv.classList.add('info');
    }

    // Idempotency / UI Guards
    if (['SENDING', 'EXECUTING', 'RECOVERING', 'CONFIRMING'].includes(presentationState)) {
        inputField.disabled = true;
        sendBtn.disabled = true;
        actionArea.innerHTML = '<i>Processing securely...</i>';
    } else if (presentationState === 'AWAITING_CONFIRMATION') {
        inputField.disabled = true;
        sendBtn.disabled = true;
        actionArea.innerHTML = `
            <button id="ai-confirm-btn" style="background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Confirm Action</button>
            <button id="ai-cancel-btn" style="background: #ef4444; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
        `;
        document.getElementById('ai-confirm-btn').addEventListener('click', () => sendChat("yes", true));
        document.getElementById('ai-cancel-btn').addEventListener('click', () => sendChat("cancel", true));
    } else {
        inputField.disabled = false;
        sendBtn.disabled = false;
        actionArea.innerHTML = '';
        if (presentationState === 'IDLE') {
            inputField.focus();
        }
    }
}

// Sending Chats
let isSending = false;
async function sendChat(textOverride = null, isConfirmation = false) {
    if (isSending) return; // Dedupe rapid clicks
    
    const inputField = document.getElementById('ai-input');
    const text = textOverride !== null ? textOverride : inputField.value.trim();
    if (!text) return;

    isSending = true;
    renderState(isConfirmation ? 'CONFIRMING' : 'SENDING', 'Sending securely...');
    
    // Optimistic UI clear
    if (!textOverride) inputField.value = '';

    try {
        const historyStr = sessionStorage.getItem('ai_chat_history');
        const history = historyStr ? JSON.parse(historyStr) : [];

        const headers = getAuthHeaders();
        const response = await fetch((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') + '/api/ai/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify({ text, conversationId, history })
        });

        const data = await response.json();
        
        // Append history
        if (!isConfirmation && data.response) {
            history.push({ role: 'user', content: text });
            if (data.response.message) {
                history.push({ role: 'model', content: data.response.message });
            }
            if (history.length > 20) history.splice(0, history.length - 20);
            sessionStorage.setItem('ai_chat_history', JSON.stringify(history));
        }

        // Start polling immediately to reconcile new state
        pollStatus(0);

    } catch (err) {
        console.error("Chat error:", err);
        renderState('FAILED', 'Failed to send message. Please check your connection.');
    } finally {
        isSending = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ai-send-btn').addEventListener('click', () => sendChat());
    document.getElementById('ai-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChat();
    });
    initSession();
});
