import WorkingMemory from '../memory/WorkingMemory.js';
import ConversationMemory from '../memory/ConversationMemory.js';
import WorkflowMemory from '../memory/WorkflowMemory.js';
import PreferenceMemory from '../memory/PreferenceMemory.js';

class MemoryEngine {
    constructor() {
        this.sessions = new Map();
    }

    getSession(userId) {
        if (!this.sessions.has(userId)) {
            this.sessions.set(userId, {
                workingMemory: new WorkingMemory(),
                conversationMemory: new ConversationMemory(),
                workflowMemory: new WorkflowMemory(),
                preferenceMemory: new PreferenceMemory()
            });
        }
        return this.sessions.get(userId);
    }
}

export default new MemoryEngine();
