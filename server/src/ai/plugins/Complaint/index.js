import BasePlugin from '../../sdk/BasePlugin.js';
import BaseCapability from '../../sdk/BaseCapability.js';
import CreateWorkflowDefinition from '../../sdk/CreateWorkflowDefinition.js';
import Classifier from '../../services/Classifier.js';
import EntityResolver from '../../services/EntityResolver.js';

const categoryDefaults = {
    Disciplinary: { department: 'Disciplinary Committee', tags: ['Student Safety'], subcategory: 'Misconduct', priority: 'High' },
    Electrical: { department: 'Maintenance Department', tags: ['Maintenance', 'Electrical'], subcategory: 'Electrical Fault', priority: 'Medium' },
    IT: { department: 'IT Support', tags: ['Network', 'Technical Support'], subcategory: 'Connectivity Issue', priority: 'Medium' },
    Sanitation: { department: 'Housekeeping Department', tags: ['Cleanliness', 'Hygiene'], subcategory: 'Cleanliness Issue', priority: 'Medium' },
    Mess: { department: 'Mess Committee', tags: ['Food', 'Mess'], subcategory: 'Food Quality Issue', priority: 'Medium' },
    Civil: { department: 'Maintenance Department', tags: ['Infrastructure'], subcategory: 'Infrastructure Issue', priority: 'High' },
    Personal: { department: 'Student Welfare Office', tags: ['Student Support'], subcategory: 'Personal Concern', priority: 'Medium' },
    Other: { department: 'Campus Administration', tags: ['General'], subcategory: 'General Complaint', priority: 'Medium' }
};

const complaintSchema = {
    required: ['category'],
    properties: {
        category: { label: 'Category', component: 'Select', enum: ['Electrical', 'Sanitation', 'Civil', 'IT', 'Mess', 'Other', 'Disciplinary', 'Personal'], required: true },
        subcategory: { label: 'Subcategory', component: 'Input' },
        priority: { label: 'Priority', component: 'Select', enum: ['Low', 'Medium', 'High', 'Critical'] },
        department: { label: 'Suggested Department', component: 'Input' },
        title: { label: 'Title', component: 'Input' },
        summary: { label: 'Summary', component: 'Textarea' },
        description: { label: 'Detailed Description', component: 'Textarea' },
        observedImpact: { label: 'Observed Impact', component: 'Textarea' },
        requestedAction: { label: 'Requested Action', component: 'Textarea' },
        tags: { label: 'Tags', component: 'Input' },
        location: {
            label: 'Location',
            component: 'Input',
            requiredIf: [
                { category: 'Disciplinary' },
                { category: 'Sanitation' },
                { category: 'Civil' },
                { category: 'Other' }
            ]
        },
        building: {
            label: 'Building/Hostel',
            component: 'Input',
            requiredIf: [{ category: 'Electrical' }, { category: 'IT' }]
        },
        buildingType: { label: 'Building Type', component: 'Hidden' },
        room: {
            label: 'Room Number',
            component: 'Input',
            requiredIf: [{ category: 'Electrical' }, { category: 'IT', buildingType: 'hostel' }]
        },
        equipment: { label: 'Equipment', component: 'Input', requiredIf: { category: 'Electrical' } },
        networkType: { label: 'Network Type', component: 'Input', requiredIf: { category: 'IT' } },
        startedAt: { label: 'When Started', component: 'Input', requiredIf: [{ category: 'Electrical' }, { category: 'IT' }, { category: 'Civil' }] },
        duration: { label: 'Duration', component: 'Input', requiredIf: { category: 'Sanitation' } },
        currentCondition: { label: 'Current Condition', component: 'Textarea', requiredIf: { category: 'Sanitation' } },
        meal: { label: 'Meal', component: 'Input', requiredIf: { category: 'Mess' } },
        foodItem: { label: 'Food Item', component: 'Input', requiredIf: { category: 'Mess' } },
        issue: {
            label: 'Issue',
            component: 'Textarea',
            requiredIf: [{ category: 'Mess' }, { category: 'Civil' }, { category: 'Personal' }, { category: 'Other' }]
        },
        incidentDate: { label: 'Incident Date', component: 'Input', requiredIf: [{ category: 'Disciplinary' }, { category: 'Mess' }] },
        incidentTime: { label: 'Incident Time', component: 'Input', requiredIf: { category: 'Disciplinary' } },
        witnesses: { label: 'Witnesses', component: 'Input', requiredIf: { category: 'Disciplinary' } },
        personsInvolved: { label: 'Persons Involved', component: 'Input', requiredIf: { category: 'Disciplinary' } }
    }
};

const prompts = {
    category: 'What type of complaint is this?',
    building: 'Which hostel or building is affected?',
    room: 'What is the room number?',
    equipment: 'Which equipment is affected?',
    startedAt: 'When did the issue start?',
    networkType: 'Is this WiFi, LAN, or another network issue?',
    location: 'Where exactly did this happen?',
    duration: 'How long has this condition been present?',
    currentCondition: 'What is the current condition of the affected area?',
    meal: 'Which meal was affected?',
    foodItem: 'Which food item had the issue?',
    issue: 'What specific issue should be recorded?',
    incidentDate: 'When did the incident happen?',
    incidentTime: 'At what time did it happen?',
    witnesses: 'Were there any witnesses? Share names if you know them, or say none.',
    personsInvolved: 'Who was involved? Use names if known, otherwise describe them.'
};

class RaiseComplaintCapability extends BaseCapability {
    constructor() {
        super({
            id: 'raiseComplaint',
            permissions: ['student', 'hosteler', 'teacher'],
            workflow: 'raiseComplaint',
            inputSchema: 'ComplaintDraft',
            outputSchema: 'ComplaintDTO',
            sideEffects: [],
            draftOnly: true,
            confirmation: false,
            timeout: 5000,
            retry: 1
        });
    }

    async validate(context) {
        if (!context.user) return { success: false, message: 'UNAUTHORIZED' };
        return { success: true };
    }

    async execute() {
        throw new Error('Complaint AI workflow is draft-only. Submit from the complaint module form.');
    }
}

export default class ComplaintPlugin extends BasePlugin {
    registerCapabilities() {
        return [new RaiseComplaintCapability()];
    }

    registerSchemas() {
        return { raiseComplaint: complaintSchema };
    }

    registerWorkflows() {
        return {
            raiseComplaint: new CreateWorkflowDefinition({
                capabilityId: 'raiseComplaint',
                entityName: 'Complaint',
                entity: 'complaint',
                redirect: '/modules/complaints/post.html',
                schema: complaintSchema,
                prompts,
                previewFields: ['title', 'summary', 'description', 'observedImpact', 'requestedAction', 'priority', 'department', 'category', 'subcategory', 'location', 'incidentDate', 'incidentTime', 'witnesses', 'tags'],
                infer: ({ parsed, entities, state }) => {
                    const existing = state?.fields || {};
                    const classification = Classifier.classify('complaint', parsed.original);
                    const resolved = EntityResolver.resolve(parsed.original);
                    const category = classification.confidence > 0.9 || !existing.category ? classification.category : existing.category;
                    const subcategory = classification.confidence > 0.9 || !existing.subcategory ? classification.subcategory : existing.subcategory;
                    const priority = classification.confidence > 0.9 || !existing.priority ? classification.priority : existing.priority;
                    const department = classification.confidence > 0.9 || !existing.department ? classification.department : existing.department;
                    const defaults = categoryDefaults[category] || categoryDefaults.Other;
                    const building = resolved.building || existing.building;

                    return {
                        ...entities,
                        ...(classification.confidence > 0.9 || !existing.category ? {
                            category,
                            subcategory,
                            priority,
                            department
                        } : {}),
                        department: department || defaults.department,
                        subcategory: subcategory || defaults.subcategory,
                        priority: priority || defaults.priority,
                        tags: [...new Set([...(defaults.tags || []), subcategory, subcategory === 'Ragging' ? 'Hostel' : null].filter(Boolean))],
                        buildingType: /^hostel\b/i.test(building || '') ? 'hostel' : 'campus',
                        ...resolved
                    };
                }
            })
        };
    }

    registerCommands() {
        return [{
            capabilityId: 'raiseComplaint',
            synonyms: ['raise complaint', 'file complaint', 'complain about', 'report an issue', 'i need help', 'ragging', 'ragged', 'fan', 'wifi', 'wi-fi', 'washroom', 'food is bad', 'water leakage', 'broken chair']
        }];
    }
}
