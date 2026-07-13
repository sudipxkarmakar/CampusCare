import BasePlugin from '../../sdk/BasePlugin.js';
import BaseCapability from '../../sdk/BaseCapability.js';
import CreateWorkflowDefinition from '../../sdk/CreateWorkflowDefinition.js';

const assignmentSchema = {
    required: ['assignmentId', 'content'],
    properties: {
        assignmentId: { label: 'Assignment ID', placeholder: 'Select assignment', component: 'Select', required: true },
        content: { label: 'Your Answer text', placeholder: 'Type or copy your submission content', component: 'Textarea', required: true }
    }
};

const teacherAssignmentSchema = {
    required: ['title', 'description', 'semester', 'deadline', 'marks', 'instructions'],
    properties: {
        title: { label: 'Title', placeholder: 'Assignment title', component: 'Input', required: true },
        description: { label: 'Description', placeholder: 'Assignment brief', component: 'Textarea', required: true },
        semester: { label: 'Semester', placeholder: 'e.g. 5', component: 'Input', required: true },
        deadline: { label: 'Deadline', placeholder: 'YYYY-MM-DD', component: 'DateInput', required: true },
        marks: { label: 'Marks', placeholder: 'e.g. 20', component: 'Input', required: true },
        instructions: { label: 'Instructions', placeholder: 'Submission instructions', component: 'Textarea', required: true },
        attachments: { label: 'Attachments', placeholder: 'Optional attachment notes', component: 'Input' }
    }
};

const noteSchema = {
    required: ['title', 'description', 'semester'],
    properties: {
        title: { label: 'Title', placeholder: 'Note title', component: 'Input', required: true },
        description: { label: 'Description', placeholder: 'Learning material description', component: 'Textarea', required: true },
        semester: { label: 'Semester', placeholder: 'e.g. 5', component: 'Input', required: true },
        attachments: { label: 'Attachments', placeholder: 'Optional attachment notes', component: 'Input' }
    }
};

class SubmitAssignmentCapability extends BaseCapability {
    constructor() {
        super({
            id: 'submitAssignment',
            permissions: ['student', 'hosteler'],
            workflow: 'submitAssignment',
            inputSchema: 'AssignmentSubmissionSchema',
            outputSchema: 'SubmissionDTO',
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
        throw new Error('Assignment AI workflow is draft-only. Submit from the assignment module form.');
    }
}

class CreateTeacherAssignmentCapability extends BaseCapability {
    constructor() {
        super({
            id: 'createTeacherAssignment',
            permissions: ['teacher', 'hod'],
            workflow: 'createTeacherAssignment',
            inputSchema: 'TeacherAssignmentDraft',
            outputSchema: 'AssignmentDTO',
            sideEffects: [],
            draftOnly: true,
            confirmation: false,
            timeout: 5000,
            retry: 1
        });
    }

    async validate(context) {
        if (!context.user || !['teacher', 'hod'].includes(context.user.role)) {
            return { success: false, message: 'Only teachers can prepare assignment drafts from this workflow.' };
        }
        return { success: true };
    }

    async execute() {
        throw new Error('Assignment AI workflow is draft-only. Publish from the assignment module form.');
    }
}

class CreateTeacherNoteCapability extends BaseCapability {
    constructor() {
        super({
            id: 'createTeacherNote',
            permissions: ['teacher', 'hod'],
            workflow: 'createTeacherNote',
            inputSchema: 'TeacherNoteDraft',
            outputSchema: 'NoteDTO',
            sideEffects: [],
            draftOnly: true,
            confirmation: false,
            timeout: 5000,
            retry: 1
        });
    }

    async validate(context) {
        if (!context.user || !['teacher', 'hod'].includes(context.user.role)) {
            return { success: false, message: 'Only teachers can prepare note drafts from this workflow.' };
        }
        return { success: true };
    }

    async execute() {
        throw new Error('Note AI workflow is draft-only. Publish from the notes module form.');
    }
}

export default class AssignmentPlugin extends BasePlugin {
    registerCapabilities() {
        return [new SubmitAssignmentCapability(), new CreateTeacherAssignmentCapability(), new CreateTeacherNoteCapability()];
    }

    registerSchemas() {
        return {
            submitAssignment: assignmentSchema,
            createTeacherAssignment: teacherAssignmentSchema,
            createTeacherNote: noteSchema
        };
    }

    registerWorkflows() {
        return {
            submitAssignment: new CreateWorkflowDefinition({
                capabilityId: 'submitAssignment',
                entityName: 'Assignment Submission',
                entity: 'assignment',
                redirect: '/modules/assignments/view.html',
                schema: assignmentSchema,
                previewFields: ['assignmentId', 'content'],
                prompts: {
                    assignmentId: 'Which assignment is this for?',
                    content: 'What content should I prepare for the submission?'
                },
                infer: ({ parsed, entities }) => {
                    const inferred = { ...entities };
                    const idMatch = parsed.original.match(/\bassignment\s*(?:id)?\s*[:#-]?\s*([a-f0-9]{12,24}|[a-z0-9_-]{3,})/i);
                    if (idMatch) inferred.assignmentId = idMatch[1];
                    if (!inferred.content && parsed.original.length > 20) inferred.content = parsed.original;
                    return inferred;
                }
            }),
            createTeacherAssignment: new CreateWorkflowDefinition({
                capabilityId: 'createTeacherAssignment',
                entityName: 'Assignment',
                entity: 'assignment',
                redirect: '/modules/assignments/post.html',
                schema: teacherAssignmentSchema,
                optionalFields: ['attachments'],
                previewFields: ['title', 'description', 'semester', 'deadline', 'marks', 'instructions', 'attachments'],
                prompts: {
                    title: 'Share the assignment topic, class, deadline, marks, and instructions together if you have them.',
                    description: 'What should students do for this assignment?',
                    semester: 'Which semester is this assignment for?',
                    deadline: 'What is the deadline? Please use YYYY-MM-DD if possible.',
                    marks: 'How many marks is this assignment worth?',
                    instructions: 'What submission instructions should I include?'
                },
                infer: ({ parsed, entities }) => {
                    const text = parsed.original;
                    const inferred = { ...entities };
                    const subjectMatch = text.match(/\b(?:for|on)\s+([A-Za-z& ]+?)(?:\s+assignment|\s+for|\s+due|\.|$)/i);
                    const yearMatch = text.match(/\b([1-8])(?:st|nd|rd|th)?\s*(?:sem|semester|year)\b/i);
                    const dateMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
                    const marksMatch = text.match(/\b(\d{1,3})\s*(?:marks|mark)\b/i);
                    if (!inferred.title) inferred.title = subjectMatch ? `${subjectMatch[1].trim()} Assignment` : 'Course Assignment';
                    if (!inferred.description && text.length > 15) inferred.description = `Complete a structured assignment on ${subjectMatch?.[1]?.trim() || 'the assigned topic'} with clear explanations, examples, and references where applicable.`;
                    if (!inferred.semester && yearMatch) inferred.semester = yearMatch[1];
                    if (!inferred.deadline && dateMatch) inferred.deadline = dateMatch[0];
                    if (!inferred.marks && marksMatch) inferred.marks = marksMatch[1];
                    if (!inferred.instructions) inferred.instructions = 'Submit a neat PDF through the assignment module before the deadline. Include your name, roll number, semester, and subject on the first page.';
                    return inferred;
                },
                composeDraft: ({ fields }) => ({
                    ...fields,
                    title: fields.title,
                    description: `${fields.description}\n\nEvaluation will consider conceptual clarity, completeness, originality, and presentation quality.`,
                    status: 'draft'
                })
            }),
            createTeacherNote: new CreateWorkflowDefinition({
                capabilityId: 'createTeacherNote',
                entityName: 'Note',
                entity: 'note',
                redirect: '/modules/assignments/post.html?type=note',
                schema: noteSchema,
                optionalFields: ['attachments'],
                previewFields: ['title', 'description', 'semester', 'attachments'],
                infer: ({ parsed, entities }) => {
                    const inferred = { ...entities };
                    const topic = parsed.original.replace(/create|post|upload|note|notes|material/ig, '').trim();
                    if (!inferred.title) inferred.title = topic ? `${topic} Notes` : 'Course Notes';
                    if (!inferred.description) inferred.description = `These notes provide a concise explanation of ${topic || 'the selected topic'}, including key definitions, classroom examples, and points for revision.`;
                    const sem = parsed.original.match(/\b([1-8])(?:st|nd|rd|th)?\s*(?:sem|semester)\b/i);
                    if (!inferred.semester && sem) inferred.semester = sem[1];
                    return inferred;
                }
            })
        };
    }

    registerCommands() {
        return [
            {
                capabilityId: 'submitAssignment',
                synonyms: ['submit assignment', 'turn in assignment', 'upload homework', 'complete assignment']
            },
            {
                capabilityId: 'createTeacherAssignment',
                synonyms: ['create assignment', 'post assignment', 'publish assignment', 'draft assignment']
            },
            {
                capabilityId: 'createTeacherNote',
                synonyms: ['create note', 'post note', 'upload note', 'create notes', 'post notes', 'upload notes']
            }
        ];
    }
}
