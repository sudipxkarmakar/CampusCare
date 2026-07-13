import EventEmitter from 'events';

class AIKernel extends EventEmitter {
    constructor() {
        super();
        this.plugins = new Map();
        this.capabilities = new Map();
        this.schemas = new Map();
        this.validators = new Map();
        this.policies = [];
        this.rules = [];
        this.searchProviders = [];
        this.workflows = new Map();
        this.presentationAdapters = new Map();
        this.recommendations = [];
        this.commands = [];
    }

    registerPlugin(plugin) {
        if (this.plugins.has(plugin.name)) return;
        this.plugins.set(plugin.name, plugin);
        plugin.initialize(this);

        // Load capabilities
        const caps = plugin.registerCapabilities() || [];
        caps.forEach(cap => this.capabilities.set(cap.contract.id, cap));

        // Load workflows
        const workflows = plugin.registerWorkflows() || {};
        for (const [key, value] of Object.entries(workflows)) {
            this.workflows.set(key, value);
        }

        // Load schemas
        const schemas = plugin.registerSchemas() || {};
        for (const [key, value] of Object.entries(schemas)) {
            this.schemas.set(key, value);
        }

        // Load validators
        const validators = plugin.registerValidators() || {};
        for (const [key, value] of Object.entries(validators)) {
            this.validators.set(key, value);
        }

        // Load search providers
        const search = plugin.registerSearchProviders() || [];
        this.searchProviders.push(...search);

        // Load policies/rules
        this.policies.push(...(plugin.registerPolicies() || []));
        this.rules.push(...(plugin.registerRules() || []));

        // Load presentation mappings
        const presentation = plugin.registerPresentation() || {};
        for (const [key, value] of Object.entries(presentation)) {
            this.presentationAdapters.set(key, value);
        }

        // Recommendations
        this.recommendations.push(...(plugin.registerRecommendations() || []));

        // Synonyms / Commands
        this.commands.push(...(plugin.registerCommands() || []));
    }

    getCapability(id) {
        return this.capabilities.get(id);
    }

    getSchema(name) {
        return this.schemas.get(name);
    }

    getWorkflow(name) {
        return this.workflows.get(name);
    }
}

export default new AIKernel();
