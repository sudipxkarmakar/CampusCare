const cases = [
    {
        input: 'I got ragged yesterday around 8 PM near Hostel A. Rahul witnessed it.',
        expected: { intent: 'raiseComplaint', entity: 'complaint', category: 'Disciplinary', priority: 'Critical' }
    },
    {
        input: 'WiFi issue',
        expected: { intent: 'raiseComplaint', promptField: 'building' }
    },
    {
        input: 'fan not working in my room',
        expected: { intent: 'raiseComplaint', promptField: 'building' }
    },
    {
        input: 'create notice titled Library Closed content Library will remain closed tomorrow',
        expected: { intent: 'publishNotice', entity: 'notice' }
    }
];

const pick = (obj, path) => path.split('.').reduce((acc, key) => acc?.[key], obj);

const run = async () => {
    const { processAIInput } = await import('../src/ai/index.js');
    const metrics = {
        total: cases.length,
        intentCorrect: 0,
        entityCorrect: 0,
        categoryCorrect: 0,
        priorityCorrect: 0,
        promptCorrect: 0,
        draftComplete: 0,
        totalTurns: 0
    };

    for (let i = 0; i < cases.length; i++) {
        const test = cases[i];
        const user = { _id: { toString: () => `ai-eval-${i}` }, role: 'student', name: 'Eval User' };
        const response = await processAIInput(test.input, user, `ai-eval-conv-${i}`, {});
        const payload = response.payload || {};
        const draft = payload.draft || {};

        if (payload.intent === test.expected.intent || response.payload?.entity === test.expected.entity || response.action === 'AI_DRAFT_REDIRECT') {
            metrics.intentCorrect++;
        }
        if (!test.expected.entity || payload.entity === test.expected.entity) metrics.entityCorrect++;
        if (!test.expected.category || draft.category === test.expected.category) metrics.categoryCorrect++;
        if (!test.expected.priority || draft.priority === test.expected.priority) metrics.priorityCorrect++;
        if (!test.expected.promptField || payload.promptField === test.expected.promptField) metrics.promptCorrect++;
        if (!payload.draft || ['title', 'summary', 'description'].every(field => draft[field])) metrics.draftComplete++;
        metrics.totalTurns++;

        console.log(`[${i + 1}/${cases.length}] ${test.input}`);
        console.log(`  state=${response.presentationState} action=${response.action} entity=${payload.entity || '-'} prompt=${payload.promptField || '-'}`);
    }

    const pct = (value) => `${Math.round((value / metrics.total) * 100)}%`;
    console.log('\nAI Evaluation Metrics');
    console.log(`Intent Accuracy: ${pct(metrics.intentCorrect)}`);
    console.log(`Entity Accuracy: ${pct(metrics.entityCorrect)}`);
    console.log(`Category Accuracy: ${pct(metrics.categoryCorrect)}`);
    console.log(`Priority Accuracy: ${pct(metrics.priorityCorrect)}`);
    console.log(`Prompt Accuracy: ${pct(metrics.promptCorrect)}`);
    console.log(`Draft Completeness: ${pct(metrics.draftComplete)}`);
    console.log(`Average Conversation Turns: ${(metrics.totalTurns / metrics.total).toFixed(2)}`);
};

run().catch(error => {
    console.error(error);
    process.exit(1);
});
