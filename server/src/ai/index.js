import AIKernel from './kernel/AIKernel.js';
import MemoryEngine from './engines/MemoryEngine.js';
import UnderstandingPipeline from './understanding/index.js';
import ConversationEngine from './engines/ConversationEngine.js';
import ExecutionRuntime from './runtimes/ExecutionRuntime.js';
import SearchRuntime from './search/SearchRuntime.js';
import LookupRuntime from './runtimes/LookupRuntime.js';
import PresentationEngine from './engines/PresentationEngine.js';
import PolicyEngine from './policies/PolicyEngine.js';

// Load Plugins
import ComplaintPlugin from './plugins/Complaint/index.js';
import NoticePlugin from './plugins/Notice/index.js';
import AssignmentPlugin from './plugins/Assignment/index.js';
import LeavePlugin from './plugins/Leave/index.js';
import MongoProvider from './search/Providers/MongoProvider.js';

// Setup Kernel integrations
AIKernel.registerPlugin(new ComplaintPlugin());
AIKernel.registerPlugin(new NoticePlugin());
AIKernel.registerPlugin(new AssignmentPlugin());
AIKernel.registerPlugin(new LeavePlugin());
AIKernel.searchProviders.push(new MongoProvider());

const lower = (value) => String(value || '').toLowerCase().trim();
const hasAny = (text, words) => words.some(word => text.includes(word));

const navigationTargets = [
    { keys: ['assignment', 'assignments'], title: 'Assignments', path: '/modules/assignments/view.html' },
    { keys: ['complaint', 'complaints'], title: 'Complaints', path: '/modules/complaints/view.html' },
    { keys: ['notice', 'notices'], title: 'Notices', path: '/modules/notices/view.html' },
    { keys: ['attendance'], title: 'Attendance', path: '/modules/attendance/view.html' },
    { keys: ['dashboard', 'home'], title: 'Dashboard', path: '/index.html' },
    { keys: ['routine'], title: 'Routine', path: '/modules/routine/view.html' },
    { keys: ['profile'], title: 'Profile', path: '/modules/profile.html' },
    { keys: ['settings'], title: 'Settings', path: '/modules/profile.html' }
];

const workflowCreateSignals = ['create', 'publish', 'post', 'submit', 'upload', 'apply', 'raise', 'file', 'report', 'complain'];

const renderResponse = (message, extra = {}) => PresentationEngine.render({
    type: 'AI_RESPONSE',
    success: extra.success !== false,
    presentationState: extra.presentationState || 'SUCCESS',
    message,
    payload: extra.payload || null
});

const handleGlobalCommand = (text, session, user) => {
    const input = lower(text);
    const command = input.replace(/[.!?]+$/g, '').trim();
    if (['cancel', 'actually cancel', 'never mind', 'forget that', 'start over', 'reset', 'stop'].includes(command)) {
        session.workflowMemory.clear();
        session.workingMemory.clear();
        return renderResponse('Okay, I cleared the current workflow. What would you like to do next?');
    }
    if (['okay', 'ok', 'awesome', 'nice', 'cool', 'great', 'fine'].includes(command)) {
        return renderResponse('Got it.');
    }
    if (['hello', 'hi', 'hey'].includes(command)) {
        return renderResponse(`Hello${user?.name ? ` ${user.name}` : ''}. How can I help you today?`);
    }
    if (['thanks', 'thank you'].includes(command)) {
        return renderResponse('You are welcome.');
    }
    if (input.includes('who are you')) {
        return renderResponse('I am CampusCare Assistant. I can help you find campus records, open modules, and prepare drafts for eligible workflows.');
    }
    if (input.includes('what can you help') || input.includes('features') || input === 'help') {
        return renderResponse('I can show assignments, notices, notes, routine, teachers, and complaints; open modules; and prepare eligible complaint, leave, assignment, and notice drafts.');
    }
    if (/^[\W_]+$/.test(input)) {
        return renderResponse('Nice one. What would you like to do today?');
    }
    return null;
};

const handleNavigation = (text) => {
    const input = lower(text);
    if (!hasAny(input, ['open', 'go to', 'goto', 'take me to']) && !input.includes('dashboard')) return null;
    if (hasAny(input, ['note', 'notes', 'material']) || hasAny(input, [' and ', 'also', 'then', 'tell me', 'show'])) return null;
    const target = navigationTargets.find(item => item.keys.some(key => input.includes(key)));
    if (!target) return null;
    return PresentationEngine.render({
        type: 'NAVIGATION',
        success: true,
        presentationState: 'SUCCESS',
        action: 'NAVIGATE',
        message: `Opening ${target.title}.`,
        payload: { title: target.title, path: target.path, entityType: 'NAVIGATION' }
    });
};

const handleRecommendation = async (text, user, clientContext) => {
    const input = lower(text);
    if (!hasAny(input, ['what should i study', 'what should i revise', 'study plan', "today's study plan", 'subject should i focus', 'am i falling behind', 'anything pending', 'any deadlines', 'prepare me for tomorrow', "what's due", 'what is due'])) return null;

    const assignments = await LookupRuntime.assignments(input.includes('tomorrow') || input.includes('deadline') ? 'due tomorrow assignments' : 'pending assignments', user);
    const routine = await LookupRuntime.routine(input.includes('tomorrow') ? 'tomorrow routine' : 'today routine', user, clientContext);
    const choices = [
        ...(assignments?.payload?.choices || []),
        ...(routine?.payload?.choices || [])
    ].slice(0, 8);

    return PresentationEngine.render({
        type: 'COLLECTION_VIEW',
        success: true,
        presentationState: choices.length ? 'SUCCESS' : 'EMPTY',
        message: choices.length ? buildStudyAdvice(assignments.payload?.choices || [], routine.payload?.choices || [], input.includes('tomorrow')) : 'I could not find pending academic items for your profile.',
        payload: { choices }
    });
};

const buildStudyAdvice = (assignments, routine, tomorrow) => {
    const firstClass = routine[0];
    const pending = assignments.length;
    if (firstClass) {
        const second = routine[1];
        return [
            `Based on ${tomorrow ? "tomorrow's" : "today's"} timetable, revise ${firstClass.subject} first because it is your next class.`,
            second ? `After that, spend 30 minutes on ${second.subject}.` : null,
            pending ? `You also have ${pending} pending assignment${pending === 1 ? '' : 's'}, so keep a short submission block after revision.` : null
        ].filter(Boolean).join(' ');
    }
    return pending
        ? `You have ${pending} pending assignment${pending === 1 ? '' : 's'}. Start with the closest deadline, then revise the subject attached to it.`
        : 'I could not find routine or deadline pressure right now.';
};

const handleAssignmentSubmissionStart = async (text, user) => {
    const input = lower(text);
    if (!hasAny(input, ['submit', 'turn in', 'upload', 'complete']) || !input.includes('assignment')) return null;
    if (hasAny(input, ['who', 'which student', 'which students', "hasn't", 'has not', 'not submitted', 'pending students'])) return null;
    const result = await LookupRuntime.assignments(text, user);
    const choices = result?.payload?.choices || [];
    return PresentationEngine.render({
        type: 'COLLECTION_VIEW',
        success: true,
        presentationState: choices.length ? 'SUCCESS' : 'EMPTY',
        message: choices.length
            ? `Found ${choices.length} matching assignment${choices.length === 1 ? '' : 's'}. Select one to continue your submission.`
            : 'I could not find matching assignments for your profile.',
        payload: { choices }
    });
};

export const processAIInput = async (text, user, conversationId, clientContext = {}) => {
    const session = MemoryEngine.getSession(user._id.toString());
    session.user = user;
    const traceId = `AI-EV-${Date.now()}`;

    const globalResult = handleGlobalCommand(text, session, user);
    if (globalResult) return globalResult;

    const navigationResult = handleNavigation(text);
    if (navigationResult) {
        session.workflowMemory.clear();
        session.workingMemory.clear();
        return navigationResult;
    }

    const recommendationResult = await handleRecommendation(text, user, clientContext);
    if (recommendationResult) {
        session.workflowMemory.clear();
        session.workingMemory.clear();
        return recommendationResult;
    }

    // 1. Process text through multi-stage understanding pipeline
    const parsedData = await UnderstandingPipeline.process(text);

    if (
        session.workflowMemory.activeWorkflowId &&
        parsedData.intent !== 'GENERAL' &&
        parsedData.intent !== session.workflowMemory.activeWorkflowId
    ) {
        session.workflowMemory.clear();
        session.workingMemory.clear();
    }

    const assignmentSelection = await handleAssignmentSubmissionStart(text, user);
    if (assignmentSelection) {
        session.workflowMemory.clear();
        session.workingMemory.clear();
        return assignmentSelection;
    }

    // 2. Search integration fallback if query indicates viewing lists/records
    const wantsCreationWorkflow = hasAny(lower(text), workflowCreateSignals) && AIKernel.getWorkflow(parsedData.intent);
    if (!session.workflowMemory.activeWorkflowId && !wantsCreationWorkflow && LookupRuntime.canHandle(text)) {
        const lookupResult = await LookupRuntime.handle(text, { user, clientContext });
        if (lookupResult) return PresentationEngine.render(lookupResult);
    }

    const hasRegisteredWorkflow = Boolean(AIKernel.getWorkflow(parsedData.intent));
    if (!session.workflowMemory.activeWorkflowId && !hasRegisteredWorkflow && (parsedData.intent === 'searchEverywhere' || parsedData.parsed.words.length < 3)) {
        const searchMatches = await SearchRuntime.query(parsedData.parsed, { user, clientContext });
        if (searchMatches.length > 0) {
            return PresentationEngine.render({
                type: 'COLLECTION_VIEW',
                message: `I found ${searchMatches.length} matching item(s) on campus:`,
                payload: { choices: searchMatches }
            });
        }
        if (parsedData.intent === 'searchEverywhere') {
            return PresentationEngine.render({
                type: 'AI_RESPONSE',
                success: true,
                presentationState: 'EMPTY',
                message: 'I could not find matching records for that request. Try mentioning a specific complaint, assignment, subject, or status keyword.'
            });
        }
    }

    // 3. Conversation Gating
    const convoResult = await ConversationEngine.handle(parsedData, session);

    if (convoResult.status === 'COLLECTING') {
        return PresentationEngine.render({
            type: 'AI_RESPONSE',
            presentationState: 'IDLE',
            message: convoResult.message,
            payload: { promptField: convoResult.promptField, intent: convoResult.intent }
        });
    }

    if (convoResult.status === 'POLICY_BLOCKED') {
        return PresentationEngine.render({
            type: 'AI_RESPONSE',
            success: false,
            presentationState: 'FAILED',
            message: convoResult.message,
            payload: convoResult.payload
        });
    }

    if (convoResult.intent === 'cancel') {
        return PresentationEngine.render({
            type: 'AI_RESPONSE',
            presentationState: 'SUCCESS',
            message: convoResult.message || 'Workflow cancelled.'
        });
    }

    if (convoResult.status === 'REDIRECTED') {
        return PresentationEngine.render({
            type: 'AI_RESPONSE',
            presentationState: 'SUCCESS',
            message: convoResult.message,
            payload: { redirectIntent: convoResult.intent }
        });
    }

    if (convoResult.status === 'DRAFT_REDIRECT') {
        return PresentationEngine.render({
            type: 'AI_DRAFT_REDIRECT',
            success: true,
            presentationState: 'DRAFT_READY',
            action: 'AI_DRAFT_REDIRECT',
            message: "I've prepared a draft based on the information you shared.\n\nI've opened the form with the draft already filled in.\n\nPlease review it, make any changes if necessary, and click Submit when you're satisfied.\n\nNothing has been submitted yet.",
            payload: convoResult.payload
        });
    }

    if (convoResult.status === 'PREVIEW') {
        const workflow = AIKernel.getWorkflow(convoResult.intent);
        return PresentationEngine.render({
            type: 'AI_DRAFT_REDIRECT',
            success: true,
            presentationState: 'DRAFT_READY',
            action: 'AI_DRAFT_REDIRECT',
            message: "I've prepared a draft based on the information you shared.\n\nI've opened the form with the draft already filled in.\n\nPlease review it, make any changes if necessary, and click Submit when you're satisfied.\n\nNothing has been submitted yet.",
            payload: workflow?.buildDraftDto(convoResult.draft) || {
                status: 'draft',
                entity: convoResult.intent,
                redirect: null,
                draft: convoResult.draft
            }
        });
    }

    // 4. Policy Check & Authorization Gating
    if (AIKernel.getWorkflow(convoResult.intent)) {
        return PresentationEngine.render({
            type: 'AI_RESPONSE',
            success: false,
            presentationState: 'FAILED',
            message: 'This AI workflow is draft-only. Please review and submit from the module form.'
        });
    }

    if (!AIKernel.getCapability(convoResult.intent)) {
        return PresentationEngine.render({
            type: 'AI_RESPONSE',
            success: true,
            presentationState: 'IDLE',
            message: 'I can help with complaint drafts, assignment submissions, notices, leave requests, schedules, notes, and record lookups. Please tell me which one you want to do.'
        });
    }

    const context = {
        user,
        session,
        traceId,
        clientContext,
        confirmed: false
    };
    const policyCheck = await PolicyEngine.evaluate(context, convoResult.intent);
    if (!policyCheck.success) {
        return PresentationEngine.render({
            type: 'AI_RESPONSE',
            success: false,
            presentationState: 'FAILED',
            message: `Policy Rejection: ${policyCheck.reason}`
        });
    }

    // 5. Execute Capability Workflow
    const execution = await ExecutionRuntime.execute(convoResult.intent, convoResult.args, context);

    if (!execution.success) {
        return PresentationEngine.render({
            type: 'AI_RESPONSE',
            success: false,
            presentationState: 'FAILED',
            message: `Execution failed: ${execution.error}`
        });
    }

    return PresentationEngine.render({
        type: 'AI_RESPONSE',
        success: true,
        action: 'AI_RESPONSE',
        presentationState: 'SUCCESS',
        message: `${convoResult.intent} completed successfully.`,
        payload: execution.payload
    });
};
