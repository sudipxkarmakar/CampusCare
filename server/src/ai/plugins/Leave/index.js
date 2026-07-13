import BasePlugin from '../../sdk/BasePlugin.js';
import BaseCapability from '../../sdk/BaseCapability.js';
import CreateWorkflowDefinition from '../../sdk/CreateWorkflowDefinition.js';

const validLeaveTypes = ['Night Out', 'Home Visit', 'Medical'];
const leaveSchema = {
    required: ['type', 'startDate', 'endDate', 'reason'],
    properties: {
        type: { label: 'Leave Type', placeholder: 'Night Out, Home Visit, Medical', component: 'Select', enum: validLeaveTypes, required: true },
        startDate: { label: 'Start Date', placeholder: 'YYYY-MM-DD', component: 'DateInput', required: true },
        endDate: { label: 'End Date', placeholder: 'YYYY-MM-DD', component: 'DateInput', required: true },
        reason: { label: 'Reason', placeholder: 'Brief reason for leave', component: 'Textarea', required: true }
    }
};

const normalizeLeaveType = (value) => {
    const text = String(value || '').toLowerCase();
    if (text.includes('night')) return 'Night Out';
    if (text.includes('medical') || text.includes('sick')) return 'Medical';
    if (text.includes('home')) return 'Home Visit';
    return null;
};

class SubmitLeaveCapability extends BaseCapability {
    constructor() {
        super({
            id: 'submitLeave',
            permissions: ['hosteler'],
            workflow: 'submitLeave',
            inputSchema: 'LeaveDraft',
            outputSchema: 'LeaveDTO',
            sideEffects: [],
            draftOnly: true,
            confirmation: false,
            timeout: 5000,
            retry: 1
        });
    }

    async validate(context) {
        if (!context.user || context.user.role !== 'hosteler') {
            return { success: false, message: 'Based on your profile, leave applications are not available from this account.' };
        }
        return { success: true };
    }

    async execute() {
        throw new Error('Leave AI workflow is draft-only. Submit from the leave module form.');
    }
}

export default class LeavePlugin extends BasePlugin {
    registerCapabilities() {
        return [new SubmitLeaveCapability()];
    }

    registerSchemas() {
        return { submitLeave: leaveSchema };
    }

    registerWorkflows() {
        return {
            submitLeave: new CreateWorkflowDefinition({
                capabilityId: 'submitLeave',
                entityName: 'Leave Application',
                entity: 'leave',
                redirect: '/student/index.html',
                schema: leaveSchema,
                previewFields: ['type', 'startDate', 'endDate', 'reason'],
                prompts: {
                    type: 'What type of leave is this?',
                    startDate: 'What is the leave start date? Please use YYYY-MM-DD.',
                    endDate: 'What is the leave end date? Please use YYYY-MM-DD.',
                    reason: 'What reason should I include in the leave application?'
                },
                infer: ({ parsed, entities }) => {
                    const inferred = { ...entities };
                    const leaveType = normalizeLeaveType(parsed.normalized);
                    if (leaveType) inferred.type = leaveType;

                    const dates = parsed.original.match(/\b\d{4}-\d{2}-\d{2}\b/g);
                    if (dates?.[0]) inferred.startDate = dates[0];
                    if (dates?.[1]) inferred.endDate = dates[1];
                    if (!inferred.reason && parsed.original.length > 20) inferred.reason = parsed.original;

                    return inferred;
                }
            })
        };
    }

    registerCommands() {
        return [{
            capabilityId: 'submitLeave',
            synonyms: ['apply leave', 'submit leave', 'leave application', 'night out', 'home visit', 'medical leave']
        }];
    }
}
