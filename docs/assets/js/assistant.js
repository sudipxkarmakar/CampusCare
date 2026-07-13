const conversationId = sessionStorage.getItem('campuscare_ai_conversation_id') || crypto.randomUUID();
sessionStorage.setItem('campuscare_ai_conversation_id', conversationId);

const localBackendPorts = new Set(['5000', '5055']);
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (localBackendPorts.has(window.location.port) ? window.location.origin : 'http://localhost:5000')
    : 'https://campuscare-backend-96cn.onrender.com';

const state = {
    busy: false,
    messages: JSON.parse(localStorage.getItem(`campuscare_ai_messages_${conversationId}`) || '[]')
};

const els = {};

function saveMessages() {
    localStorage.setItem(`campuscare_ai_messages_${conversationId}`, JSON.stringify(state.messages.slice(-40)));
}

function setStatus(message, tone = 'info') {
    if (!els.status) return;
    els.status.textContent = message;
    els.status.className = `status-banner ${tone}`;
}

function setBusy(value) {
    state.busy = value;
    if (els.input) els.input.disabled = value;
    if (els.send) els.send.disabled = value;
    setStatus(value ? 'Working on it...' : 'Ready.', value ? 'loading' : 'info');
}

function appendMessage(role, content, persist = true) {
    if (!els.history) return null;
    const message = document.createElement('div');
    message.className = `message ${role}`;

    const body = document.createElement('div');
    body.className = 'message-content';
    body.innerHTML = content.replace(/\n/g, '<br>');

    message.appendChild(body);
    els.history.appendChild(message);
    els.history.scrollTop = els.history.scrollHeight;

    if (persist) {
        state.messages.push({ role, content });
        saveMessages();
    }
    return message;
}

function renderChoiceCards(result) {
    if (!els.history) return;
    if (result?.action === 'NAVIGATE') return;
    const choices = result?.payload?.choices || [];
    if (!choices.length) return;

    const container = document.createElement('div');
    container.className = 'choice-container';

    choices.forEach((choice, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'choice-card';
        card.dataset.choiceId = choice.id || choice._id || '';

        const title = document.createElement('div');
        title.className = 'choice-title';
        title.textContent = `${index + 1}. ${choice.title || choice.subject || 'Item'}`;

        const meta = document.createElement('div');
        meta.className = 'choice-meta';
        meta.textContent = buildChoiceMeta(result.entityType, choice);

        card.append(title, meta);
        card.addEventListener('click', () => {
            if (choice.path) {
                window.top.location.href = choice.path;
                return;
            }
            if (choice.fileUrl) {
                window.open(choice.fileUrl, '_blank');
                return;
            }
            const selected = card.dataset.choiceId || String(index + 1);
            container.remove();
            sendChat(`__choice__:${selected}`, `Selected: ${choice.title || choice.subject || 'item'}`);
        });
        container.appendChild(card);
    });

    els.history.appendChild(container);
    els.history.scrollTop = els.history.scrollHeight;
}

function buildChoiceMeta(entityType, choice) {
    if (entityType === 'ASSIGNMENT') {
        const due = choice.deadline ? new Date(choice.deadline).toLocaleDateString() : 'No due date';
        return `${choice.subject || 'Subject'} | Due: ${due} | ${choice.facultyName || 'Faculty'}`;
    }
    if (entityType === 'SCHEDULE') {
        return `${choice.subject || 'Class'} | ${choice.facultyName || 'Faculty'}${choice.room ? ` | Room ${choice.room}` : ''}`;
    }
    if (entityType === 'SUBJECT') {
        return choice.facultyName || 'Faculty not assigned';
    }
    if (entityType === 'TEACHER') {
        return [choice.subject, choice.facultyName, choice.meta].filter(Boolean).join(' | ');
    }
    if (entityType === 'MAR_MOOC') {
        const date = choice.date ? new Date(choice.date).toLocaleDateString() : '';
        return [choice.subject, choice.status, choice.points !== undefined ? `${choice.points} points/credits` : '', choice.platform, date].filter(Boolean).join(' | ');
    }
    if (entityType === 'NOTICE') {
        const date = choice.date ? new Date(choice.date).toLocaleDateString() : '';
        return `${choice.subject || 'notice'}${date ? ` | ${date}` : ''}`;
    }
    if (entityType === 'EVENT') {
        const date = choice.date ? new Date(choice.date).toLocaleDateString() : '';
        return `Event${date ? ` | ${date}` : ''}${choice.postedBy ? ` | ${choice.postedBy}` : ''}`;
    }
    if (entityType === 'COMPLAINT') {
        return `${choice.subject || choice.status || 'Status'} | ${choice.category || ''} ${choice.priority || ''}`.trim();
    }
    if (entityType === 'SUBMISSION') {
        const date = choice.date ? new Date(choice.date).toLocaleDateString() : '';
        return `${choice.subject || 'Assignment'} | ${choice.status || 'Submitted'}${date ? ` | ${date}` : ''}`;
    }
    return [choice.subject, choice.facultyName, choice.meta].filter(Boolean).join(' | ');
}

function renderAction(result) {
    if (!els.actionArea) return;
    els.actionArea.innerHTML = '';

    if (result?.action === 'NAVIGATE' && result.payload?.path) {
        window.top.location.href = result.payload.path;
        return;
    }

    if (result?.action === 'AI_DRAFT_REDIRECT' && result.payload?.draft) {
        const { entity, redirect, draft } = result.payload;
        sessionStorage.setItem('campuscareAiDraft', JSON.stringify(result.payload));
        sessionStorage.setItem(`campuscareAiDraft:${entity}`, JSON.stringify(draft));

        if (entity === 'complaint') {
            sessionStorage.setItem('aiDraftTitle', draft.title || '');
            sessionStorage.setItem('aiDraftDesc', draft.description || '');
            sessionStorage.setItem('aiDraftComplaint', JSON.stringify(draft));
        }
        if (entity === 'notice') {
            sessionStorage.setItem('aiDraftNoticeTitle', draft.title || '');
            sessionStorage.setItem('aiDraftNoticeText', draft.content || draft.description || '');
        }
        if (entity === 'assignment') {
            sessionStorage.setItem('aiSubmitAssignmentId', draft.assignmentId || '');
            sessionStorage.setItem('aiDraftAssignmentText', draft.content || '');
        }
        if (entity === 'leave') {
            sessionStorage.setItem('aiLeaveType', draft.type || '');
            sessionStorage.setItem('aiLeaveReason', draft.reason || '');
        }

        const link = document.createElement('a');
        link.href = redirect || '#';
        link.target = '_top';
        link.className = 'btn-confirm';
        link.textContent = `Review ${String(entity || 'Draft').replace(/^\w/, c => c.toUpperCase())}`;
        els.actionArea.appendChild(link);

        if (redirect) {
            setTimeout(() => {
                window.top.location.href = redirect;
            }, 400);
        }
        return;
    }

    if (result?.action === 'OPEN_NOTE' && result.payload?.fileUrl) {
        window.open(result.payload.fileUrl, '_blank');
    }

    if (result?.action === 'ASSIGNMENT_DRAFTED' && result.payload) {
        sessionStorage.setItem('aiSubmitSubject', result.payload.subject || '');
        sessionStorage.setItem('aiSubmitTitle', result.payload.assignmentTitle || '');
        sessionStorage.setItem('aiSubmitAssignmentId', result.payload.assignmentId || '');
        sessionStorage.setItem('aiDraftAssignmentText', result.payload.draftText || '');
        const link = document.createElement('a');
        link.href = 'modules/assignments/view.html';
        link.target = '_top';
        link.className = 'btn-confirm';
        link.textContent = 'Review Assignment';
        els.actionArea.appendChild(link);
    }

    if (result?.action === 'PREFILL_COMPLAINT' && result.payload) {
        sessionStorage.setItem('aiDraftTitle', result.payload.title || '');
        sessionStorage.setItem('aiDraftDesc', result.payload.description || '');
        const link = document.createElement('a');
        link.href = 'modules/complaints/post.html';
        link.target = '_top';
        link.className = 'btn-confirm';
        link.textContent = 'Review Complaint';
        els.actionArea.appendChild(link);
    }

    if (result?.action === 'LEAVE_DRAFTED' && result.payload) {
        sessionStorage.setItem('aiLeaveType', result.payload.type || '');
        sessionStorage.setItem('aiLeaveReason', result.payload.reason || '');
        const link = document.createElement('a');
        link.href = 'student/index.html';
        link.target = '_top';
        link.className = 'btn-confirm';
        link.textContent = 'Review Leave';
        els.actionArea.appendChild(link);
    }

    if (result?.action === 'PREFILL_NOTICE' && result.payload) {
        sessionStorage.setItem('aiDraftNoticeText', result.payload.text || '');
        sessionStorage.setItem('aiDraftNoticeTitle', result.payload.title || '');
        const link = document.createElement('a');
        link.href = 'modules/notices/post.html';
        link.target = '_top';
        link.className = 'btn-confirm';
        link.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; text-decoration: none; gap: 8px;';
        link.innerHTML = '<i class="fa-solid fa-bullhorn"></i> Create Notice';
        els.actionArea.appendChild(link);
    }

    if (result?.action === 'OUTREACH_WHATSAPP_DRAFTED' && result.payload?.text) {
        const encodedText = encodeURIComponent(result.payload.text);
        const url = `https://web.whatsapp.com/send?text=${encodedText}`;
        try {
            window.open(url, '_blank');
        } catch (e) {
            console.error('Popup blocked:', e);
        }
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.className = 'btn-confirm';
        link.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; text-decoration: none; gap: 8px;';
        link.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Open WhatsApp';
        els.actionArea.appendChild(link);
    }
}

async function sendChat(rawText = null, displayText = null) {
    if (state.busy) return;
    const text = rawText ?? els.input.value.trim();
    if (!text) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.token) {
        appendMessage('model', 'Please log in before using the assistant.');
        return;
    }

    appendMessage('user', displayText || text);
    if (!rawText && els.input) els.input.value = '';
    setBusy(true);

    try {
        const response = await fetch(`${API_BASE}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                text,
                conversationId,
                history: state.messages.slice(-10)
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Assistant request failed');

        const result = data.response || data;
        if (result?.action === 'NAVIGATE') {
            renderAction(result);
            setStatus('Opening...', 'loading');
            return;
        }
        appendMessage('model', result.message || 'Done.');
        renderChoiceCards(result);
        renderAction(result);
        setStatus(result.presentationState === 'FAILED' ? 'Request failed.' : 'Ready.', result.presentationState === 'FAILED' ? 'error' : 'info');
    } catch (error) {
        appendMessage('model', error.message || 'I could not reach the assistant.');
        setStatus('Connection problem.', 'error');
    } finally {
        setBusy(false);
        if (els.input) els.input.focus();
    }
}

function restoreMessages() {
    if (!state.messages.length) {
        appendMessage('model', 'Hi, I can help with assignments, schedules, subjects, teachers, notices, notes, complaints, and status tracking.', false);
        return;
    }
    state.messages.forEach((message) => appendMessage(message.role, message.content, false));
}

function newChat() {
    const nextId = crypto.randomUUID();
    sessionStorage.setItem('campuscare_ai_conversation_id', nextId);
    localStorage.removeItem(`campuscare_ai_messages_${conversationId}`);
    window.location.reload();
}

function init() {
    els.history = document.getElementById('ai-chat-history');
    els.status = document.getElementById('ai-status');
    els.actionArea = document.getElementById('ai-action-area');
    els.input = document.getElementById('ai-input');
    els.send = document.getElementById('ai-send-btn');

    restoreMessages();
    setStatus('Ready.');

    if (els.send) els.send.addEventListener('click', () => sendChat());
    if (els.input) {
        els.input.addEventListener('keydown', (event) => {
            if ((event.key === 'Enter' || event.keyCode === 13) && !event.shiftKey) {
                event.preventDefault();
                sendChat();
            }
        });
    }

    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) newChatBtn.addEventListener('click', newChat);

    // Listen for postMessage from parent window to autofocus input
    window.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'focusInput') {
            if (els.input) {
                setTimeout(() => {
                    els.input.focus();
                }, 100);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
