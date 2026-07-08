/**
 * campuscare-assistant-drawer.js (Legacy name: ai.js)
 * 
 * This script injects the CampusCare Assistant drawer and manages its visibility.
 * 
 * Chat logic lives in assistant.js inside the assistant.html iframe.
 */

const AssistantDrawer = {
    id: 'campuscare-ai-drawer',
    
    init() {
        if (document.getElementById(this.id)) return;

        const container = document.createElement('div');
        container.id = this.id;
        container.style.cssText = `
            position: fixed;
            top: 0;
            right: -450px;
            width: 450px;
            max-width: 90vw;
            height: 100vh;
            background: white;
            box-shadow: -10px 0 30px rgba(0,0,0,0.1);
            z-index: 9999;
            transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            border-left: 1px solid #e2e8f0;
        `;

        const isSubDir = this.checkSubDir();
        const rootPath = isSubDir ? '../' : '';

        container.innerHTML = `
            <div style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #fff;">
                <h3 style="margin: 0; font-size: 1rem; color: #0f172a;">CampusCare Assistant</h3>
                <button id="close-ai-drawer" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
            </div>
            <iframe src="${rootPath}assistant.html?mode=drawer&v=3.6" style="flex: 1; border: none; width: 100%;"></iframe>
        `;

        document.body.appendChild(container);
        document.getElementById('close-ai-drawer').onclick = () => this.toggle(false);
    },

    checkSubDir() {
        const segments = window.location.pathname.split('/').filter(s => s);
        return segments.some(s => ['student', 'teacher', 'hostel', 'complaints', 'hod', 'warden', 'principal', 'dean'].includes(s.toLowerCase()));
    },

    toggle(force) {
        this.init();
        const drawer = document.getElementById(this.id);
        const isOpen = drawer.style.right === '0px';
        const shouldOpen = typeof force === 'boolean' ? force : !isOpen;
        drawer.style.right = shouldOpen ? '0px' : '-450px';
    }
};

// Global Override for AI Modal (Compatibility with legacy SOS triggers)
window.toggleModal = function(id) {
    if (id === 'ai-modal') {
        AssistantDrawer.toggle();
        return;
    }
    
    const modal = document.getElementById(id);
    if (modal) {
        const currentDisplay = modal.style.display || window.getComputedStyle(modal).display;
        if (currentDisplay === 'none') {
            modal.style.display = 'flex';
        } else {
            modal.style.display = 'none';
        }
    }
};

// Self-init if called from a page expecting immediate drawer setup
// (Optional: can be removed if all pages use toggleModal)
document.addEventListener('DOMContentLoaded', () => {
    // If the page has an AI trigger button, make sure it works
    const aiBtn = document.querySelector('[onclick*="toggleModal(\'ai-modal\')"]');
    if (aiBtn) AssistantDrawer.init();
});
