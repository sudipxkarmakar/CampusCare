export default class WorkingMemory {
    constructor() {
        this.data = new Map();
    }

    set(key, val) { this.data.set(key, val); }
    get(key) { return this.data.get(key); }
    clear() { this.data.clear(); }
}
