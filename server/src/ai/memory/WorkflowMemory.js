export default class WorkflowMemory {
    constructor() {
        this.activeWorkflowId = null;
        this.collectedFields = {};
        this.stage = null;
        this.draft = null;
        this.preview = null;
        this.checkpoints = [];
        this.startedAt = null;
        this.lastUpdatedAt = null;
    }

    start(workflowId) {
        this.activeWorkflowId = workflowId;
        this.collectedFields = {};
        this.stage = 'intent';
        this.draft = null;
        this.preview = null;
        this.checkpoints = [];
        this.startedAt = Date.now();
        this.lastUpdatedAt = Date.now();
    }

    touch(stage) {
        if (stage) this.stage = stage;
        this.lastUpdatedAt = Date.now();
    }

    setDraft(draft, preview) {
        this.draft = draft;
        this.preview = preview || null;
        this.touch('preview');
    }

    checkpoint(index, state) {
        this.checkpoints.push({ index, state, timestamp: Date.now() });
    }

    rollbackTo(index) {
        this.checkpoints = this.checkpoints.filter(cp => cp.index <= index);
        const lastValid = this.checkpoints[this.checkpoints.length - 1];
        return lastValid ? lastValid.state : null;
    }

    clear() {
        this.activeWorkflowId = null;
        this.collectedFields = {};
        this.stage = null;
        this.draft = null;
        this.preview = null;
        this.checkpoints = [];
        this.startedAt = null;
        this.lastUpdatedAt = null;
    }
}
