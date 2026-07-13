export default class BasePlugin {
    constructor() {
        this.name = this.constructor.name;
    }

    initialize(kernel) {
        this.kernel = kernel;
    }

    registerCapabilities() { return []; }
    registerSchemas() { return {}; }
    registerValidators() { return {}; }
    registerPolicies() { return []; }
    registerRules() { return []; }
    registerSearchProviders() { return []; }
    registerWorkflows() { return {}; }
    registerPresentation() { return {}; }
    registerNotifications() { return {}; }
    registerRecommendations() { return []; }
    registerEvents() { return []; }
    registerCommands() { return []; }
    registerTests() { return []; }
    shutdown() {}
}
