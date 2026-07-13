class PresentationEngine {
    constructor() {
        this.adapters = new Map();
    }

    registerAdapter(type, adapter) {
        this.adapters.set(type, adapter);
    }

    render(dto) {
        const type = dto.type || 'AI_RESPONSE';
        const adapter = this.adapters.get(type);
        if (adapter) {
            return adapter.format(dto);
        }

        // Standard response DTO fallback
        return {
            version: 'v1',
            success: dto.success !== false,
            presentationState: dto.presentationState || 'SUCCESS',
            action: dto.action || 'AI_RESPONSE',
            message: dto.message || 'Done.',
            payload: dto.payload || null,
            timestamp: Date.now()
        };
    }
}

export default new PresentationEngine();
