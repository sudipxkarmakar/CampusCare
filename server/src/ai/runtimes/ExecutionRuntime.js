import AIKernel from '../kernel/AIKernel.js';

class ExecutionRuntime {
    async execute(capabilityId, args, context) {
        const capability = AIKernel.getCapability(capabilityId);
        if (!capability) {
            throw new Error(`Capability not found: ${capabilityId}`);
        }

        if (capability.contract.draftOnly === true) {
            throw new Error('This AI capability is draft-only. Use the owning module form to submit.');
        }

        if (capability.contract.confirmation === true && context.confirmed !== true) {
            throw new Error('Confirmation required before this action can be executed.');
        }

        // Validate capability execution context (permissions, rules, schemas)
        const valResult = await capability.validate(context);
        if (!valResult.success) {
            throw new Error(valResult.message || 'Validation failed.');
        }

        const startTime = Date.now();
        try {
            const payload = await capability.execute(args, context);
            const duration = Date.now() - startTime;

            return {
                success: true,
                capabilityId,
                payload,
                duration
            };
        } catch (error) {
            return {
                success: false,
                capabilityId,
                error: error.message
            };
        }
    }
}

export default new ExecutionRuntime();
