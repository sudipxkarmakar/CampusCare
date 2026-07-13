export default class BaseWorkflow {
    constructor(steps) {
        this.steps = steps || [];
    }

    async run(context) {
        let currentStepIndex = 0;
        const results = [];
        try {
            for (let i = 0; i < this.steps.length; i++) {
                currentStepIndex = i;
                const stepResult = await this.steps[i](context);
                results.push(stepResult);
                context.session.workflowMemory.checkpoint(i, stepResult);
            }
            return { success: true, results };
        } catch (error) {
            return { success: false, failedIndex: currentStepIndex, error: error.message };
        }
    }
}
