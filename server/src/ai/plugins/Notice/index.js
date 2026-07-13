import BasePlugin from '../../sdk/BasePlugin.js';
import BaseCapability from '../../sdk/BaseCapability.js';
import CreateWorkflowDefinition from '../../sdk/CreateWorkflowDefinition.js';

const noticeSchema = {
    required: ['title', 'content'],
    properties: {
        title: { label: 'Notice Title', placeholder: 'e.g. Exam Schedule Postponed', component: 'Input', required: true },
        content: { label: 'Notice Details', placeholder: 'Provide full announcement details', component: 'Textarea', required: true },
        audience: { label: 'Audience Group', placeholder: 'general, student, teacher, hosteler', component: 'Select', enum: ['general', 'student', 'teacher', 'hosteler'] },
        date: { label: 'Date', placeholder: 'YYYY-MM-DD or relative date', component: 'Input' },
        priority: { label: 'Priority', placeholder: 'Low, Medium, High', component: 'Select', enum: ['Low', 'Medium', 'High'] },
        attachments: { label: 'Attachments', placeholder: 'Optional attachment notes', component: 'Input' }
    }
};

class PublishNoticeCapability extends BaseCapability {
    constructor() {
        super({
            id: 'publishNotice',
            permissions: ['teacher', 'hod', 'principal', 'admin'],
            workflow: 'publishNotice',
            inputSchema: 'NoticeDraft',
            outputSchema: 'NoticeDTO',
            sideEffects: [],
            draftOnly: true,
            confirmation: false,
            timeout: 5000,
            retry: 1
        });
    }

    async validate(context) {
        const user = context.user;
        if (!user || !['teacher', 'hod', 'principal', 'admin'].includes(user.role)) {
            return { success: false, message: 'Students cannot publish notices. You can view notices, search notices, or report an incorrect notice.' };
        }
        return { success: true };
    }

    async execute() {
        throw new Error('Notice AI workflow is draft-only. Publish from the notice module form.');
    }
}

export default class NoticePlugin extends BasePlugin {
    registerCapabilities() {
        return [new PublishNoticeCapability()];
    }

    registerSchemas() {
        return { publishNotice: noticeSchema };
    }

    registerWorkflows() {
        return {
            publishNotice: new CreateWorkflowDefinition({
                capabilityId: 'publishNotice',
                entityName: 'Notice',
                entity: 'notice',
                redirect: '/modules/notices/post.html',
                schema: noticeSchema,
                optionalFields: ['audience', 'date', 'priority', 'attachments'],
                previewFields: ['title', 'content', 'audience', 'date', 'priority', 'attachments'],
                prompts: {
                    title: 'What should the notice title be?',
                    content: 'What should the notice say?',
                    audience: 'Who should receive this notice?'
                },
                infer: ({ parsed, entities }) => {
                    const inferred = { ...entities };
                    const text = parsed.normalized;
                    const structured = parsed.original.match(/(?:title|titled)\s+(.+?)\s+(?:content|message|body)\s+(.+)$/i);

                    if (structured) {
                        inferred.title = structured[1].trim();
                        inferred.content = structured[2].trim();
                    }

                    if (!inferred.audience) {
                        if (text.includes('student')) inferred.audience = 'student';
                        else if (text.includes('teacher') || text.includes('faculty')) inferred.audience = 'teacher';
                        else if (text.includes('hostel') || text.includes('hosteler')) inferred.audience = 'hosteler';
                        else inferred.audience = 'general';
                    }

                    if (text.includes('tomorrow')) inferred.date = 'tomorrow';
                    if (!inferred.priority) inferred.priority = text.includes('urgent') ? 'High' : 'Medium';

                    if (!inferred.title && text.includes('lab') && (text.includes('no lab') || text.includes('cancel'))) {
                        inferred.title = 'Laboratory Session Cancellation';
                    }

                    if (!inferred.content && text.includes('lab') && (text.includes('no lab') || text.includes('cancel'))) {
                        inferred.content = 'This is to inform all students that the scheduled laboratory session for tomorrow has been cancelled due to unavoidable circumstances.\n\nStudents are advised to attend their remaining classes as usual.\n\nFurther updates will be communicated if required.';
                    } else if (!inferred.content && parsed.original.length > 20) {
                        inferred.content = parsed.original;
                    }

                    return inferred;
                },
                composeDraft: ({ fields }) => {
                    const raw = fields.content || '';
                    const content = raw.includes('\n') || raw.length > 90
                        ? raw
                        : `This is to inform all concerned students that ${raw.trim().replace(/\.$/, '')}.\n\nStudents are advised to follow the instructions communicated by the department.\n\nFurther updates will be communicated if required.`;
                    return {
                        ...fields,
                        content,
                        status: 'draft'
                    };
                }
            })
        };
    }

    registerCommands() {
        return [{
            capabilityId: 'publishNotice',
            synonyms: ['publish notice', 'post notice', 'create notice', 'draft notice', 'create announcement', 'post announcement', 'create event', 'announce holiday', 'college closed']
        }];
    }
}
