export default class PreferenceMemory {
    constructor() {
        this.preferences = new Map();
    }

    set(key, val) { this.preferences.set(key, val); }
    get(key) { return this.preferences.get(key); }
}
