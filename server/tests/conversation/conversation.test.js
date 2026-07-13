import AIKernel from '../../src/ai/kernel/AIKernel.js';
import ConversationEngine from '../../src/ai/engines/ConversationEngine.js';
import MemoryEngine from '../../src/ai/engines/MemoryEngine.js';
import assert from 'assert';

import ComplaintPlugin from '../../src/ai/plugins/Complaint/index.js';

console.log('Running interactive wizard session tests...');

AIKernel.registerPlugin(new ComplaintPlugin());

const userId = '693ab17e5c6ed5d729c044dc';
const session = MemoryEngine.getSession(userId);
session.user = {
    _id: userId,
    role: 'hosteler',
    department: 'CSE',
    hostelName: 'Hostel A',
    roomNumber: '101',
    messSubscriber: true
};

// Initial state
assert.strictEqual(session.workflowMemory.activeWorkflowId, null);

// Trigger a wizard gathering flow
const inputData = {
    intent: 'raiseComplaint',
    entities: { title: 'Broken pipe' },
    parsed: { normalized: 'complain broken pipe' }
};

const result = await ConversationEngine.handle(inputData, session);
assert.strictEqual(result.status, 'COLLECTING');
assert.strictEqual(result.promptField, 'location');

session.workflowMemory.clear();
session.workingMemory.clear();
session.user = {
    _id: userId,
    role: 'student',
    department: 'CSE'
};

const blocked = await ConversationEngine.handle({
    intent: 'raiseComplaint',
    entities: {},
    parsed: { normalized: 'complain about bad mess food', original: 'complain about bad mess food' }
}, session);

assert.strictEqual(blocked.status, 'POLICY_BLOCKED');
assert.match(blocked.message, /Mess complaint/);

console.log('Interactive wizard session tests completed!');
