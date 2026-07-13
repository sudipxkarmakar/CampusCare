export default class BaseCapability {
    constructor(contract) {
        this.contract = contract; // ID, permissions, workflow template, schemas
    }

    async validate(context) {
        // Enforce basic execution validation
        return { success: true };
    }

    async execute(context) {
        throw new Error('Not implemented');
    }
}
