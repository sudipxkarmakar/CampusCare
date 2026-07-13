export default class ConversationMemory {
    constructor() {
        this.history = [];
    }

    add(role, content) {
        this.history.push({ role, content, timestamp: Date.now() });
        if (this.history.length > 20) {
            this.history.shift();
        }
    }

    get() { return this.history; }
    clear() { this.history = []; }
}
