import crypto from 'crypto';
import Groq from 'groq-sdk';

import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Complaint from '../models/Complaint.js';
import Notice from '../models/Notice.js';
import Note from '../models/Note.js';
import Routine from '../models/Routine.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import MarMooc from '../models/MarMooc.js';
import AIActionLog from '../models/AIActionLog.js';
import { EXECUTION_STATUS, CONFIRMATION_STATUS } from '../constants/aiConstants.js';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const pendingByConversation = new Map();
const contextByConversation = new Map();

const clean = (value, fallback = '') => {
    if (value === undefined || value === null) return fallback;
    return String(value).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
};

const asId = (value) => value?._id?.toString?.() || value?.toString?.() || '';

const includesAny = (text, words) => words.some((word) => text.includes(word));

const formatDate = (value) => {
    if (!value) return 'No date set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No date set';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const sortKeyForTimeSlot = (timeSlot = '') => {
    const match = String(timeSlot).match(/(\d{1,2})(?::(\d{2}))?/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    if (hour > 0 && hour < 8) hour += 12;
    return hour * 60 + minute;
};

const dateFromClientContext = (clientContext = {}) => {
    const rawDate = clientContext.isoDate || clientContext.date || clientContext.localeDate;
    const date = rawDate ? new Date(rawDate) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
};

const dayIndexFromClientContext = (clientContext = {}) => {
    if (Number.isInteger(clientContext.dayIndex) && clientContext.dayIndex >= 0 && clientContext.dayIndex < 7) {
        return clientContext.dayIndex;
    }
    if (clientContext.weekday) {
        const index = DAY_ORDER.findIndex((day) => day.toLowerCase() === String(clientContext.weekday).toLowerCase());
        if (index >= 0) return index;
    }
    const date = dateFromClientContext(clientContext);
    return (date.getDay() + 6) % 7;
};

const resolveRequestedDay = (input, clientContext = {}) => {
    const lower = input.toLowerCase();
    const explicit = DAY_ORDER.find((day) => lower.includes(day.toLowerCase()));
    if (explicit) return explicit;

    const todayIndex = dayIndexFromClientContext(clientContext);
    if (includesAny(lower, ['today', 'todays', "today's"])) {
        return DAY_ORDER[todayIndex];
    }
    if (includesAny(lower, ['tomorrow', "tomorrow's"])) {
        return DAY_ORDER[(todayIndex + 1) % 7];
    }
    if (includesAny(lower, ['yesterday', "yesterday's"])) {
        return DAY_ORDER[(todayIndex + 6) % 7];
    }
    return null;
};

const getTraceId = () => `AI-${new Date().getFullYear()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

class CampusAgentService {
    constructor() {
        this.groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
        this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    }

    async processInput(text, user, history = [], conversationId = null, clientContext = {}) {
        const input = clean(text);
        const traceId = getTraceId();
        const activeConversationId = conversationId || crypto.randomUUID();

        if (!input) {
            return this.reply('Please type what you need help with.', { traceId });
        }

        let intent = 'GENERAL';
        try {
            const choiceResult = await this.resolvePendingChoice(input, user, activeConversationId, traceId);
            if (choiceResult) return choiceResult;

            const contextResult = await this.answerFromContext(input, activeConversationId, traceId);
            if (contextResult) return contextResult;

            intent = this.detectIntent(input, user, activeConversationId);
            let result;

            if (intent === 'complaint_create') result = await this.createComplaint(input, user, activeConversationId, traceId);
            else if (intent === 'assignment_submit') result = await this.submitAssignment(input, user, activeConversationId, traceId);
            else if (intent === 'assignments') result = await this.getAssignments(user, activeConversationId, traceId, input);
            else if (intent === 'schedule') result = await this.getSchedule(user, activeConversationId, traceId, input, clientContext);
            else if (intent === 'subjects') result = await this.getSubjects(user, activeConversationId, traceId);
            else if (intent === 'teachers') result = await this.getTeachers(user, activeConversationId, traceId, input);
            else if (intent === 'events') result = await this.getNotices(user, activeConversationId, traceId, input, false, true);
            else if (intent === 'notices') result = await this.getNotices(user, activeConversationId, traceId, input);
            else if (intent === 'holidays') result = await this.getNotices(user, activeConversationId, traceId, input, true);
            else if (intent === 'notes') result = await this.getNotes(user, activeConversationId, traceId, input);
            else if (intent === 'mar_moocs') result = await this.getMarMoocs(user, activeConversationId, traceId, input);
            else if (intent === 'status') result = await this.getStatus(user, traceId, input);
            else if (intent === 'leave') result = await this.draftLeave(input, user, activeConversationId, traceId);
            else result = await this.answerGeneral(input, user, history, traceId, clientContext);

            await this.logAction({
                traceId,
                conversationId: activeConversationId,
                user,
                intent,
                status: result.success === false ? EXECUTION_STATUS.FAILED : EXECUTION_STATUS.COMPLETED,
                args: { text: input, clientContext }
            });

            return result;
        } catch (error) {
            console.error('[CampusAgent] Error:', error);
            await this.logAction({
                traceId,
                conversationId: activeConversationId,
                user,
                intent: 'ERROR',
                status: EXECUTION_STATUS.FAILED,
                args: { text: input, clientContext },
                errorMessage: error.message
            });
            return this.reply('I could not complete that request. Please try again with a little more detail.', {
                success: false,
                presentationState: 'FAILED',
                traceId
            });
        }
    }

    detectIntent(input, user, conversationId = null) {
        const lower = input.toLowerCase();
        const ctx = conversationId ? contextByConversation.get(conversationId) : null;
        if (ctx && (ctx.entityType === 'NOTICE' || ctx.entityType === 'EVENT')) {
            if (includesAny(lower, ['do that', 'fetch archived', 'archived', 'archive', 'old', 'older', 'previous', 'past'])) {
                return ctx.entityType === 'EVENT' ? 'events' : 'notices';
            }
        }
        if (ctx?.entityType === 'SCHEDULE') {
            if (includesAny(lower, ['today', 'todays', "today's", 'tomorrow', "tomorrow's", 'yesterday', "yesterday's", ...DAY_ORDER.map((day) => day.toLowerCase())])) {
                return 'schedule';
            }
        }
        if (includesAny(lower, ['night out', 'leave', 'home visit', 'medical leave', 'apply for'])) return 'leave';
        if (includesAny(lower, ['submit', 'turn in', 'complete', 'upload', 'draft', 'write', 'prepare']) && includesAny(lower, ['assignment', 'homework', 'work'])) return 'assignment_submit';
        if (includesAny(lower, ['complaint', 'complain', 'issue', 'problem', 'broken', 'not working', 'harassment', 'ragging'])) return 'complaint_create';
        if (includesAny(lower, ['assignment', 'homework', 'pending work', 'deadline'])) return 'assignments';
        if (includesAny(lower, ['routine', 'timetable', 'schedule', 'class', 'period'])) return 'schedule';
        if (includesAny(lower, ['subject', 'course', 'syllabus'])) return 'subjects';
        if (includesAny(lower, ['teacher', 'faculty', 'mentor', 'professor'])) return 'teachers';
        if (includesAny(lower, ['holiday', 'vacation', 'college closed', 'closed tomorrow'])) return 'holidays';
        if (includesAny(lower, ['event', 'seminar', 'workshop', 'competition', 'tournament', 'cultural', 'sports'])) return 'events';
        if (includesAny(lower, ['notice', 'announcement', 'circular', 'news'])) return 'notices';
        if (includesAny(lower, ['mar', 'mooc', 'monthly assessment'])) return 'mar_moocs';
        if (includesAny(lower, ['note', 'notes', 'study material', 'material', 'lecture'])) return 'notes';
        if (includesAny(lower, ['status', 'track', 'progress', 'resolved', 'submitted'])) return 'status';
        return 'general';
    }

    async resolvePendingChoice(input, user, conversationId, traceId) {
        const pending = pendingByConversation.get(conversationId);
        const lower = input.toLowerCase();
        let selectedId = null;
        const choiceMatch = input.match(/^__choice__:(.+)$/);
        if (choiceMatch) selectedId = choiceMatch[1].trim();

        if (!pending) {
            if (selectedId) return this.getItemDetail(user, selectedId, conversationId, traceId);
            return null;
        }

        let selected = selectedId
            ? pending.choices.find((choice) => choice.id === selectedId || choice._id === selectedId)
            : null;

        if (!selected) {
            const idx = Number.parseInt(input, 10);
            if (Number.isInteger(idx) && idx > 0) selected = pending.choices[idx - 1];
        }

        if (!selected) {
            selected = pending.choices.find((choice) => {
                const title = `${choice.title || ''} ${choice.subject || ''}`.toLowerCase();
                return title && (title.includes(lower) || lower.includes(title));
            });
        }

        if (!selected && pending.type === 'assignment_submit' && pending.choices.length === 1) {
            if (includesAny(lower, ['submit', 'draft', 'write', 'prepare', 'confirm', 'this assignment', 'go ahead', 'proceed'])) {
                selected = pending.choices[0];
            }
        }

        if (!selected) return null;
        pendingByConversation.delete(conversationId);

        if (pending.type === 'assignment_submit') {
            return this.submitAssignment(input, user, conversationId, traceId, selected.id);
        }

        if (pending.type === 'assignment_detail') {
            return this.getAssignmentDetail(user, selected.id, conversationId, traceId);
        }

        if (pending.type === 'item_detail') {
            return this.getItemDetail(user, selected.id, conversationId, traceId, selected);
        }

        if (pending.type === 'note_open') {
            return {
                version: 'v1',
                success: true,
                presentationState: 'SUCCESS',
                action: 'OPEN_NOTE',
                message: `Opening ${selected.title}.`,
                payload: { fileUrl: selected.fileUrl },
                timestamp: Date.now(),
                traceId
            };
        }

        return this.reply(`Selected ${selected.title || selected.subject || 'item'}.`, { traceId });
    }

    async getAssignments(user, conversationId, traceId, input = '') {
        this.requireUser(user);

        if (user.role === 'teacher' || user.role === 'hod') {
            const created = await Assignment.find({ teacher: user._id }).sort({ deadline: 1 }).lean();
            const rows = await Promise.all(created.map(async (assignment) => ({
                id: assignment._id.toString(),
                title: assignment.title,
                subject: assignment.subject,
                deadline: assignment.deadline,
                submissionCount: await Submission.countDocuments({ assignment: assignment._id })
            })));

            return this.collection('ASSIGNMENT', rows, rows.length
                ? `You have ${rows.length} assignment${rows.length === 1 ? '' : 's'} created.`
                : 'You have not created any assignments yet.', traceId);
        }

        const assignments = await this.findVisibleAssignments(user);
        if (assignments.length) {
            pendingByConversation.set(conversationId, {
                type: 'assignment_detail',
                choices: assignments,
                createdAt: Date.now()
            });
        }
        return this.collection('ASSIGNMENT', assignments, assignments.length
            ? `You have ${assignments.length} pending assignment${assignments.length === 1 ? '' : 's'}.`
            : 'You do not have pending assignments right now.', traceId);
    }

    async getAssignmentDetail(user, assignmentId, conversationId, traceId) {
        this.requireUser(user);

        const visibleAssignments = await this.findVisibleAssignments(user);
        const visible = visibleAssignments.find((assignment) => assignment.id === assignmentId);
        if (!visible) {
            return this.reply('I could not open that assignment from your current account. It may already be submitted or not assigned to your class.', {
                success: false,
                presentationState: 'FAILED',
                traceId
            });
        }

        const assignment = await Assignment.findById(assignmentId).populate('teacher', 'name email').lean();
        if (!assignment) {
            return this.reply('That assignment no longer exists.', {
                success: false,
                presentationState: 'FAILED',
                traceId
            });
        }

        pendingByConversation.set(conversationId, {
            type: 'assignment_submit',
            choices: [visible],
            createdAt: Date.now()
        });

        const due = formatDate(assignment.deadline);
        const teacher = assignment.teacher?.name || visible.facultyName || 'Faculty';
        const description = assignment.description ? `\n\nDetails: ${assignment.description}` : '';
        const link = assignment.link ? `\n\nAttachment/link: ${assignment.link}` : '';
        const message = [
            `${assignment.title}`,
            `Subject: ${assignment.subject}`,
            `Teacher: ${teacher}`,
            `Due: ${due}${description}${link}`,
            'If you want help, say "draft this assignment" and include your answer/content if you have it. You will make the final submission yourself.'
        ].join('\n');

        return {
            version: 'v1',
            success: true,
            presentationState: 'SUCCESS',
            action: 'AI_RESPONSE',
            semanticType: 'ASSIGNMENT_DETAIL',
            entityType: 'ASSIGNMENT',
            message,
            payload: { assignment: visible },
            timestamp: Date.now(),
            traceId
        };
    }

    async getItemDetail(user, itemId, conversationId, traceId, provided = null) {
        const ctx = contextByConversation.get(conversationId);
        const item = provided || ctx?.items?.find((entry) => entry.id === itemId || entry._id === itemId);

        if (!item) {
            return this.reply('I could not find that item in the current conversation. Please ask me to list it again.', {
                success: false,
                presentationState: 'FAILED',
                traceId
            });
        }

        contextByConversation.set(conversationId, {
            ...(ctx || {}),
            selected: item,
            updatedAt: Date.now()
        });

        const entityType = ctx?.entityType || item.entityType || 'ITEM';
        if (entityType === 'TEACHER') {
            const lines = [
                item.title || 'Faculty',
                item.meta ? `Role: ${item.meta}` : null,
                item.subject ? `Designation: ${item.subject}` : null,
                item.facultyName ? `Department: ${item.facultyName}` : null
            ].filter(Boolean);
            return this.reply(lines.join('\n'), {
                action: 'AI_RESPONSE',
                payload: { item },
                traceId
            });
        }

        if (entityType === 'MAR_MOOC') {
            const lines = [
                item.title || 'MAR/MOOC Record',
                item.subject ? `Category: ${item.subject}` : null,
                item.status ? `Status: ${item.status}` : null,
                item.points !== undefined ? `Points/Credits: ${item.points}` : null,
                item.platform ? `Platform: ${item.platform}` : null,
                item.date ? `Date: ${formatDate(item.date)}` : null
            ].filter(Boolean);
            return this.reply(lines.join('\n'), {
                action: 'AI_RESPONSE',
                payload: { item },
                traceId
            });
        }

        const lines = [
            item.title || item.subject || 'Details',
            item.subject ? `Type/subject: ${item.subject}` : null,
            item.facultyName ? `Faculty: ${item.facultyName}` : null,
            item.postedBy ? `Posted by: ${item.postedBy}` : null,
            item.date ? `Date: ${formatDate(item.date)}` : null,
            item.room ? `Room: ${item.room}` : null,
            item.content || item.description || item.meta || null
        ].filter(Boolean);

        return {
            version: 'v1',
            success: true,
            presentationState: 'SUCCESS',
            action: 'AI_RESPONSE',
            semanticType: 'DETAIL_VIEW',
            entityType,
            message: lines.join('\n'),
            payload: { item },
            timestamp: Date.now(),
            traceId
        };
    }

    async submitAssignment(input, user, conversationId, traceId, forcedAssignmentId = null) {
        this.requireRole(user, ['student', 'hosteler'], 'Only students can submit assignments.');
        const assignments = await this.findVisibleAssignments(user);

        if (assignments.length === 0) {
            return this.reply('I could not find any pending assignment to submit.', { traceId });
        }

        let assignment = forcedAssignmentId
            ? assignments.find((item) => item.id === forcedAssignmentId)
            : this.pickAssignment(assignments, input);

        if (!assignment && assignments.length > 1) {
            pendingByConversation.set(conversationId, { type: 'assignment_submit', choices: assignments, createdAt: Date.now() });
            return this.collection('ASSIGNMENT', assignments, 'Which assignment should I submit?', traceId, 'ACTION_SELECTION');
        }

        assignment = assignment || assignments[0];
        const dbAssignment = await Assignment.findById(assignment.id).populate('teacher', 'name').lean();
        if (!dbAssignment) return this.reply('That assignment was not found anymore.', { success: false, traceId });

        const existing = await Submission.findOne({ assignment: dbAssignment._id, student: user._id });
        if (existing) {
            return this.reply(`"${dbAssignment.title}" is already submitted.`, {
                presentationState: 'SUCCESS',
                action: 'AI_RESPONSE',
                payload: { submissionId: existing._id },
                traceId
            });
        }

        const draftText = await this.buildAssignmentSubmission(input, user, dbAssignment);

        return {
            version: 'v1',
            success: true,
            presentationState: 'SUCCESS',
            action: 'ASSIGNMENT_DRAFTED',
            message: `I drafted the response for "${dbAssignment.title}". I will open the assignment form with the draft ready; you will make the final submission yourself.`,
            payload: {
                assignmentId: dbAssignment._id,
                assignmentTitle: dbAssignment.title,
                subject: dbAssignment.subject,
                draftText
            },
            timestamp: Date.now(),
            traceId
        };
    }

    async createComplaint(input, user, conversationId, traceId) {
        this.requireUser(user);
        const draft = await this.generateComplaintDraft(input, user);

        contextByConversation.set(conversationId, {
            entityType: 'COMPLAINT_DRAFT',
            selected: draft,
            items: [draft],
            updatedAt: Date.now()
        });

        return {
            version: 'v1',
            success: true,
            presentationState: 'SUCCESS',
            action: 'PREFILL_COMPLAINT',
            message: `I drafted your complaint but did not submit it. Category: ${draft.category}. Priority: ${draft.priority}. Please review and submit it from the complaint form.`,
            payload: draft,
            timestamp: Date.now(),
            traceId
        };
    }

    async getSchedule(user, conversationId, traceId, input = '', clientContext = {}) {
        this.requireUser(user);
        const selectedDay = resolveRequestedDay(input, clientContext);
        const filter = { department: user.department };

        if (user.role === 'student' || user.role === 'hosteler') {
            if (user.year) filter.year = user.year;
            if (user.batch) filter.batch = { $in: this.batchValues(user.batch) };
            if (user.subBatch) {
                filter.$or = [
                    { subBatch: user.subBatch },
                    { subBatch: { $exists: false } },
                    { subBatch: null },
                    { subBatch: '' }
                ];
            }
        } else if (user.role === 'teacher') {
            filter.$or = [{ teacher: user._id }, { subjectName: { $in: user.teachingSubjects || [] } }];
        }
        if (selectedDay) filter.day = selectedDay;

        const rows = await Routine.find(filter)
            .populate('teacher', 'name')
            .populate('subject', 'name code')
            .lean();

        rows.sort((a, b) => {
            const dayDelta = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
            return dayDelta || sortKeyForTimeSlot(a.timeSlot) - sortKeyForTimeSlot(b.timeSlot) || (a.period || 0) - (b.period || 0);
        });

        const choices = rows.map((row) => ({
            id: row._id.toString(),
            title: `${row.day} ${row.timeSlot}`,
            subject: row.subject?.name || row.subjectName || 'Class',
            facultyName: row.teacher?.name || 'Faculty not assigned',
            room: row.room || '',
            entityType: 'SCHEDULE'
        }));

        const dateNote = clientContext.localeDate ? ` based on ${clientContext.localeDate}` : '';
        const message = choices.length
            ? `Here ${selectedDay ? `is your ${selectedDay}` : 'is your'} class schedule${selectedDay ? dateNote : ''}.`
            : selectedDay ? `I could not find any classes for ${selectedDay} in your batch schedule${dateNote}.` : 'I could not find a schedule for your profile.';

        this.rememberCollection(conversationId, 'SCHEDULE', choices);
        return this.collection('SCHEDULE', choices, message, traceId, 'SCHEDULE_VIEW');
    }

    async getSubjects(user, conversationId, traceId) {
        this.requireUser(user);
        const filter = {};
        if (user.department) filter.department = user.department;
        if (user.role === 'student' || user.role === 'hosteler') {
            if (user.year) filter.year = user.year;
            if (user.batch) {
                const batches = this.batchValues(user.batch);
                filter.$or = [
                    { batch: { $in: batches } },
                    { 'batchAssignments.batch': { $in: batches } },
                    { batch: { $exists: false } },
                    { batch: '' }
                ];
            }
        } else if (user.role === 'teacher') {
            filter.$or = [{ teacher: user._id }, { teachers: user._id }, { name: { $in: user.teachingSubjects || [] } }];
        }

        const subjects = await Subject.find(filter).populate('teacher teachers batchAssignments.teacher', 'name').lean();
        const batches = this.batchValues(user.batch);
        const choices = subjects
            .filter((subject) => !/(^|\b)(mar|mooc|monthly assessment)(\b|$)/i.test(`${subject.name || ''} ${subject.code || ''}`))
            .map((subject) => {
                const assignedTeacher = this.teacherForStudentBatch(subject, batches);
                return {
                    id: subject._id.toString(),
                    title: `${subject.name} (${subject.code})`,
                    subject: subject.name,
                    facultyName: assignedTeacher?.name || 'Faculty not assigned',
                    entityType: 'SUBJECT'
                };
            });

        this.rememberCollection(conversationId, 'SUBJECT', choices);
        return this.collection('SUBJECT', choices, choices.length ? `You have ${choices.length} subject${choices.length === 1 ? '' : 's'} for your batch.` : 'I could not find subjects for your profile.', traceId);
    }

    async getTeachers(user, conversationId, traceId, input = '') {
        this.requireUser(user);
        let teachers = [];
        const wantsMentor = /\bmentor\b/i.test(input);

        if (user.role === 'student' || user.role === 'hosteler') {
            const batches = this.batchValues(user.batch);
            const routineFilter = { department: user.department };
            if (user.year) routineFilter.year = user.year;
            if (user.batch) routineFilter.batch = { $in: batches };
            const routines = await Routine.find(routineFilter).populate('teacher', 'name role designation department specialization email contactNumber').lean();

            const subjectFilter = { department: user.department };
            if (user.year) subjectFilter.year = user.year;
            if (user.batch) {
                subjectFilter.$or = [
                    { batch: { $in: batches } },
                    { 'batchAssignments.batch': { $in: batches } },
                    { batch: { $exists: false } },
                    { batch: '' }
                ];
            }
            const subjects = await Subject.find(subjectFilter)
                .populate('teacher teachers batchAssignments.teacher', 'name role designation department specialization email contactNumber')
                .lean();

            const teacherMap = new Map();
            const addTeacher = (teacher, relation = 'Assigned faculty') => {
                if (!teacher?._id) return;
                const id = teacher._id.toString();
                teacherMap.set(id, { ...teacher, relation });
            };

            routines.forEach((routine) => addTeacher(routine.teacher));
            subjects.forEach((subject) => {
                addTeacher(this.teacherForStudentBatch(subject, batches));
            });

            if (wantsMentor) {
                const fullUser = await User.findById(user._id).populate('mentor', 'name role designation department specialization email contactNumber').lean();
                teacherMap.clear();
                addTeacher(fullUser?.mentor, 'Mentor');
            }
            teachers = Array.from(teacherMap.values());
        } else {
            const filter = { role: { $in: ['teacher', 'hod', 'warden', 'principal', 'dean'] } };
            if (user.department && !['principal', 'dean', 'admin'].includes(user.role)) filter.department = user.department;
            teachers = await User.find(filter).select('name role designation department specialization email contactNumber').lean();
        }

        const choices = teachers.map((teacher) => ({
            id: teacher._id.toString(),
            title: teacher.name,
            subject: teacher.designation || teacher.role,
            facultyName: teacher.department || '',
            meta: teacher.relation || teacher.specialization || teacher.email || teacher.contactNumber || '',
            entityType: 'TEACHER'
        }));

        this.rememberCollection(conversationId, 'TEACHER', choices);
        const message = wantsMentor
            ? (choices.length ? 'Here is your assigned mentor.' : 'I could not find a mentor assigned to your profile.')
            : (choices.length ? `You have ${choices.length} assigned teacher${choices.length === 1 ? '' : 's'} for your batch.` : 'I could not find batch-assigned faculty records.');
        return this.collection('TEACHER', choices, message, traceId);
    }

    async getNotices(user, conversationId, traceId, input = '', holidaysOnly = false, eventsOnly = false) {
        const lower = input.toLowerCase();
        const ctx = contextByConversation.get(conversationId);
        const audience = this.audienceFor(user);
        const filter = { audience: { $in: audience } };
        const allowOld = includesAny(lower, ['do that', 'old', 'older', 'all', 'previous', 'past', 'archive', 'archived', 'history'])
            || (ctx && (ctx.entityType === 'NOTICE' || ctx.entityType === 'EVENT') && !ctx.items?.length);

        if (user?.department && !['admin', 'principal', 'dean', 'warden'].includes(user.role)) {
            filter.$and = [{ $or: [{ targetDept: user.department }, { targetDept: { $exists: false } }, { targetDept: '' }] }];
        }

        if ((user?.role === 'student' || user?.role === 'hosteler') && user.year) {
            filter.$and = [
                ...(filter.$and || []),
                { $or: [{ targetYear: user.year }, { targetYear: { $exists: false } }, { targetYear: '' }] }
            ];
        }

        if ((user?.role === 'student' || user?.role === 'hosteler') && user.batch) {
            const batches = this.batchValues(user.batch);
            filter.$and = [
                ...(filter.$and || []),
                { $or: [{ targetBatch: { $in: batches } }, { targetBatch: { $exists: false } }, { targetBatch: '' }] }
            ];
        }

        if (!allowOld) {
            const cutoff = new Date();
            if (eventsOnly) {
                cutoff.setHours(0, 0, 0, 0);
            } else {
                cutoff.setDate(cutoff.getDate() - 30);
            }
            filter.date = { $gte: cutoff };
        }

        if (holidaysOnly) {
            filter.$or = [
                { title: /holiday|vacation|closed|break|leave/i },
                { content: /holiday|vacation|closed|break|leave/i }
            ];
        }

        if (eventsOnly) {
            const eventClause = [
                { title: /event|seminar|workshop|competition|tournament|cultural|sports|fest/i },
                { content: /event|seminar|workshop|competition|tournament|cultural|sports|fest/i }
            ];
            filter.$and = [...(filter.$and || []), { $or: eventClause }];
        }

        const sort = eventsOnly ? { date: 1, createdAt: -1 } : { createdAt: -1 };
        const notices = await Notice.find(filter).populate('postedBy', 'name role designation').sort(sort).limit(10).lean();
        const choices = notices.map((notice) => ({
            id: notice._id.toString(),
            title: notice.title,
            subject: notice.audience || 'general',
            content: notice.content,
            date: notice.date || notice.createdAt,
            postedBy: notice.postedBy?.name || 'Unknown',
            postedByRole: notice.postedBy?.designation || notice.postedBy?.role || '',
            entityType: eventsOnly ? 'EVENT' : 'NOTICE'
        }));

        const message = choices.length
            ? eventsOnly ? (allowOld ? 'Here are the archived event notices I found.' : 'Here are the upcoming or recent events I found.') : holidaysOnly ? 'Here are the holiday or closure notices I found.' : allowOld ? 'Here are the archived notices I found.' : 'Here are the recent notices.'
            : eventsOnly ? 'I could not find any current event notices. Ask for old events if you want archived notices.' : holidaysOnly ? 'I could not find any current holiday notices.' : 'I could not find recent notices for your profile. Ask for old notices if you want archived ones.';

        this.rememberCollection(conversationId, eventsOnly ? 'EVENT' : 'NOTICE', choices);
        return this.collection(eventsOnly ? 'EVENT' : 'NOTICE', choices, message, traceId);
    }

    async getNotes(user, conversationId, traceId, input = '') {
        this.requireUser(user);
        const filter = { department: user.department };
        if (user.role === 'student' || user.role === 'hosteler') {
            if (user.year) filter.year = user.year;
            if (user.batch) filter.batch = { $in: this.batchValues(user.batch) };
            if (user.subBatch) {
                filter.$or = [
                    { subBatch: user.subBatch },
                    { subBatch: { $exists: false } },
                    { subBatch: null },
                    { subBatch: '' }
                ];
            }
        } else if (user.role === 'teacher') {
            filter.uploadedBy = user._id;
        }

        const subject = this.extractSubject(input);
        if (subject) filter.subject = new RegExp(subject, 'i');

        const notes = await Note.find(filter).populate('uploadedBy', 'name').sort({ createdAt: -1 }).limit(10).lean();
        const choices = notes.map((note) => ({
            id: note._id.toString(),
            title: note.topic,
            subject: note.subject,
            facultyName: note.uploadedBy?.name || 'Faculty',
            fileUrl: note.fileUrl,
            entityType: 'NOTE'
        }));

        if (choices.length) pendingByConversation.set(conversationId, { type: 'note_open', choices, createdAt: Date.now() });
        this.rememberCollection(conversationId, 'NOTE', choices, false);
        return this.collection('NOTE', choices, choices.length ? 'Here are the learning materials I found. Select one to open it.' : 'I could not find matching notes.', traceId);
    }

    async getStatus(user, traceId, input = '') {
        this.requireUser(user);
        const lower = input.toLowerCase();

        if (includesAny(lower, ['complaint', 'issue', 'resolved'])) {
            const query = ['admin', 'principal', 'dean', 'warden', 'hod'].includes(user.role) ? {} : { student: user._id };
            const complaints = await Complaint.find(query).sort({ createdAt: -1 }).limit(10).lean();
            const choices = complaints.map((complaint) => ({
                id: complaint._id.toString(),
                title: complaint.title,
                subject: complaint.status,
                priority: complaint.priority,
                category: complaint.category,
                date: complaint.createdAt
            }));
            return this.collection('COMPLAINT', choices, choices.length ? 'Here are the latest complaint statuses.' : 'No complaints found.', traceId);
        }

        const submissions = await Submission.find({ student: user._id })
            .populate('assignment', 'title subject deadline')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const choices = submissions.map((submission) => ({
            id: submission._id.toString(),
            title: submission.assignment?.title || 'Assignment',
            subject: submission.assignment?.subject || submission.status,
            status: submission.status,
            date: submission.submittedAt
        }));
        return this.collection('SUBMISSION', choices, choices.length ? 'Here are your latest assignment submissions.' : 'No assignment submissions found.', traceId);
    }

    async getMarMoocs(user, conversationId, traceId, input = '') {
        this.requireRole(user, ['student', 'hosteler'], 'MAR and MOOC records are available for student accounts.');
        const lower = input.toLowerCase();
        const filter = { student: user._id };
        if (lower.includes('mar') && !lower.includes('mooc')) filter.category = 'mar';
        if (lower.includes('mooc') && !lower.includes('mar')) filter.category = 'mooc';

        const records = await MarMooc.find(filter).sort({ completionDate: -1, createdAt: -1 }).limit(10).lean();
        const choices = records.map((record) => ({
            id: record._id.toString(),
            title: record.title,
            subject: record.category === 'mooc' ? 'MOOC' : 'MAR Activity',
            status: record.status,
            points: record.points,
            platform: record.platform || '',
            date: record.completionDate || record.createdAt,
            entityType: 'MAR_MOOC'
        }));

        this.rememberCollection(conversationId, 'MAR_MOOC', choices);
        const total = records.reduce((sum, record) => sum + (Number(record.points) || 0), 0);
        const label = filter.category === 'mar' ? 'MAR' : filter.category === 'mooc' ? 'MOOC' : 'MAR/MOOC';
        const message = choices.length
            ? `Here are your ${label} records. Total points/credits shown: ${total}.`
            : `I could not find ${label} records for your profile.`;
        return this.collection('MAR_MOOC', choices, message, traceId);
    }

    async draftLeave(input, user, conversationId, traceId) {
        this.requireUser(user);
        const lower = input.toLowerCase();
        const leaveType = lower.includes('night out') ? 'Night Out' : lower.includes('medical') ? 'Medical' : 'Home Visit';

        if (leaveType === 'Night Out' && user.role !== 'hosteler') {
            return this.reply('Night out applications are restricted to hostelers. Your logged-in role is student, so I cannot prepare or submit a night out request for this account.', {
                success: false,
                presentationState: 'RESTRICTED',
                traceId
            });
        }

        if (user.role !== 'hosteler' && leaveType !== 'Medical') {
            return this.reply('This leave workflow is available only for hostelers in the hostel section. I did not submit anything.', {
                success: false,
                presentationState: 'RESTRICTED',
                traceId
            });
        }

        const draft = {
            type: leaveType,
            startDate: '',
            endDate: '',
            reason: this.extractReason(input) || input
        };

        contextByConversation.set(conversationId, {
            entityType: 'LEAVE_DRAFT',
            selected: draft,
            items: [draft],
            updatedAt: Date.now()
        });

        return {
            version: 'v1',
            success: true,
            presentationState: 'SUCCESS',
            action: 'LEAVE_DRAFTED',
            message: `I drafted a ${leaveType} request, but I did not submit it. Please review the hostel leave form and submit it yourself.`,
            payload: draft,
            timestamp: Date.now(),
            traceId
        };
    }

    async answerGeneral(input, user, history, traceId, clientContext = {}) {
        const role = user?.role || 'guest';
        const prompt = [
            {
                role: 'system',
                content: [
                    'You are CampusCare Assistant.',
                    'The request is authenticated when a user profile is present. Do not say you lack account access, student ID, role, designation, or campus data if those values are provided below.',
                    'Use the profile context as authoritative for role, designation, department, year, batch, assigned work, and identity.',
                    'For data-backed tasks, answer from the provided backend result or ask for the one missing detail. Never redirect the user to an external LMS unless the backend has no record.',
                    'Never claim you performed an action unless a backend tool result is present.',
                    'Be concise and practical.',
                    `Current user date/time context: ${clientContext.localeDate || formatDate(clientContext.isoDate)}; timezone=${clientContext.timeZone || 'unknown'}; iso=${clientContext.isoDate || 'unknown'}. Use this for words like today, tomorrow, and yesterday.`,
                    '',
                    this.buildProfileContext(user)
                ].join('\n')
            },
            ...this.safeHistory(history),
            { role: 'user', content: input }
        ];

        const content = await this.llmText(prompt, this.capabilityMessage(role, user));
        return this.reply(content, { traceId });
    }

    async buildAssignmentSubmission(input, user, assignment) {
        const provided = this.extractProvidedWork(input);
        if (provided) {
            return [
                `Student: ${user.name}`,
                `Assignment: ${assignment.title}`,
                `Subject: ${assignment.subject}`,
                '',
                provided
            ].join('\n');
        }

        const fallback = [
            `Student: ${user.name}`,
            `Assignment: ${assignment.title}`,
            `Subject: ${assignment.subject}`,
            '',
            `Submission prepared by CampusCare Assistant based on the assignment request.`,
            '',
            `I have reviewed the assignment topic "${assignment.title}" and organized the response in a clear, structured way. The work explains the main idea, connects it with the subject context, and presents the response in original wording for faculty review.`
        ].join('\n');

        return this.llmText([
            { role: 'system', content: 'Prepare a polished student assignment submission from the available assignment details. Keep it original, structured, and suitable for faculty review. Do not invent citations or data. Return readable plain text with clear line breaks and blank lines between sections. Do not use markdown bold markers like **.' },
            { role: 'user', content: `Student: ${user.name}\nSubject: ${assignment.subject}\nTitle: ${assignment.title}\nDescription: ${assignment.description || 'No description'}\nStudent request: ${input}` }
        ], fallback);
    }

    async generateComplaintDraft(prompt, user = null) {
        const text = clean(prompt);
        const fallback = this.heuristicComplaintDraft(text);
        const generated = await this.llmJson([
            { role: 'system', content: 'Return only JSON with title, description, category, priority. Categories: Electrical, Sanitation, Civil, IT, Mess, Other, Disciplinary, Personal. Priorities: Low, Medium, High, Urgent. Write the complaint formally in first person when suitable.' },
            { role: 'user', content: `User: ${user?.name || 'Campus user'}\nComplaint: ${text}` }
        ], fallback);

        return {
            title: clean(generated.title, fallback.title).slice(0, 120),
            description: clean(generated.description, fallback.description).slice(0, 2000),
            category: this.allowed(generated.category, ['Electrical', 'Sanitation', 'Civil', 'IT', 'Mess', 'Other', 'Disciplinary', 'Personal'], fallback.category),
            priority: this.allowed(generated.priority, ['Low', 'Medium', 'High', 'Urgent'], fallback.priority)
        };
    }

    async generateNoticeDraft(prompt, user = null) {
        const text = clean(prompt);
        const posterName = user?.name || 'Administration';
        const posterRole = user?.designation || user?.role || 'Faculty';
        const fallbackBody = `This is to inform all concerned that ${text}. All students and staff members are requested to take note and act accordingly. For further details, please contact the administration office.`;
        const body = await this.llmText([
            {
                role: 'system',
                content: 'You are a college notice writer. Write a formal, professional notice body (not a title) for the campus notice board. Keep it 3-5 sentences. Use formal language suitable for students, faculty, and staff. Do not include a title or heading. Do not use markdown. Plain text only.'
            },
            {
                role: 'user',
                content: `Notice subject: ${text}\nPosted by: ${posterName} (${posterRole})\nWrite the body of the notice:`
            }
        ], fallbackBody);
        return { body: clean(body, fallbackBody) };
    }

    async generateLeaderMessageDraft(prompt, user = null) {
        const text = clean(prompt);
        const fallbackBody = `As an academic leader, my mission is to foster a culture of excellence, innovation, and integrity. ${text ? `Focusing on ${text}.` : ''}`;
        const body = await this.llmText([
            {
                role: 'system',
                content: 'You are an academic leader (Principal, Vice Principal, Dean, HOD, or Professor). Write an inspiring, professional leadership message or quote (1-2 sentences) for the college portal. Keep it motivating, concise, and focused on student growth and academic excellence. Do not use markdown. Plain text only.'
            },
            {
                role: 'user',
                content: `Quote context: ${text}\nWrite the leadership message/quote:`
            }
        ], fallbackBody);
        return { message: clean(body, fallbackBody) };
    }

    heuristicComplaintDraft(text) {
        const lower = text.toLowerCase();
        let category = 'Other';
        if (includesAny(lower, ['fan', 'light', 'electric', 'power', 'wire', 'shock'])) category = 'Electrical';
        else if (includesAny(lower, ['toilet', 'washroom', 'dirty', 'clean', 'garbage', 'smell'])) category = 'Sanitation';
        else if (includesAny(lower, ['bench', 'door', 'window', 'wall', 'pipe', 'water leak'])) category = 'Civil';
        else if (includesAny(lower, ['wifi', 'internet', 'computer', 'projector', 'network'])) category = 'IT';
        else if (includesAny(lower, ['food', 'mess', 'canteen', 'meal'])) category = 'Mess';
        else if (includesAny(lower, ['ragging', 'fight', 'harassment', 'theft', 'stolen'])) category = 'Disciplinary';
        else if (includesAny(lower, ['personal', 'mentor', 'teacher'])) category = 'Personal';

        let priority = 'Medium';
        if (includesAny(lower, ['fire', 'shock', 'injury', 'harassment', 'ragging', 'urgent', 'danger'])) priority = 'Urgent';
        else if (includesAny(lower, ['not working', 'broken', 'leak', 'stolen'])) priority = 'High';
        else if (includesAny(lower, ['minor', 'request', 'suggestion'])) priority = 'Low';

        return {
            title: this.titleFromText(text, category),
            description: text || 'I would like to report an issue that needs administrative attention.',
            category,
            priority
        };
    }

    async findVisibleAssignments(user) {
        const filter = {};
        if (user.role === 'student' || user.role === 'hosteler') {
            filter.department = user.department;
            if (user.year) filter.year = user.year;
            if (user.batch) filter.batch = { $in: [...this.batchValues(user.batch), 'All', 'all'] };
            const audienceClauses = [];
            if (user.section) audienceClauses.push({ section: user.section });
            if (user.subBatch) audienceClauses.push({ subBatch: user.subBatch });
            audienceClauses.push(
                { section: { $exists: false }, subBatch: { $exists: false } },
                { section: null, subBatch: null },
                { section: '', subBatch: '' }
            );
            filter.$or = audienceClauses;
        } else if (user.role === 'teacher' || user.role === 'hod') {
            filter.teacher = user._id;
        }

        const assignments = await Assignment.find(filter).populate('teacher', 'name').sort({ deadline: 1 }).lean();
        const submissions = await Submission.find({ student: user._id }).select('assignment').lean();
        const submitted = new Set(submissions.map((submission) => submission.assignment.toString()));

        return assignments
            .filter((assignment) => !submitted.has(assignment._id.toString()))
            .map((assignment) => ({
                id: assignment._id.toString(),
                title: assignment.title,
                subject: assignment.subject,
                deadline: assignment.deadline,
                facultyName: assignment.teacher?.name || 'Faculty',
                description: assignment.description || '',
                assignmentType: assignment.type || 'assignment',
                entityType: 'ASSIGNMENT'
            }));
    }

    batchValues(batch) {
        const raw = clean(batch);
        if (!raw) return [];
        const digits = raw.match(/\d+/)?.[0];
        return Array.from(new Set([
            raw,
            raw.toLowerCase(),
            digits,
            digits ? `Batch ${digits}` : null,
            digits ? `batch ${digits}` : null
        ].filter(Boolean)));
    }

    pickAssignment(assignments, input) {
        const lower = input.toLowerCase();
        return assignments.find((assignment) => lower.includes(assignment.id.toLowerCase()))
            || assignments.find((assignment) => lower.includes(String(assignment.title).toLowerCase()))
            || assignments.find((assignment) => lower.includes(String(assignment.subject).toLowerCase()));
    }

    extractProvidedWork(input) {
        const marker = input.match(/(?:answer|content|work|submission)\s*:\s*([\s\S]+)/i);
        if (marker?.[1]?.trim().length > 20) return marker[1].trim();
        return null;
    }

    extractReason(input) {
        const marker = input.match(/(?:because|reason is|due to|for)\s+(.+)/i);
        return marker?.[1]?.trim();
    }

    extractSubject(input) {
        const match = input.match(/(?:for|about|on|of)\s+([a-z0-9 ._-]{3,60})/i);
        return match?.[1]?.replace(/\b(notes?|materials?|assignment|class|routine)\b/ig, '').trim();
    }

    teacherForStudentBatch(subject, batches = []) {
        const batchAssignment = (subject.batchAssignments || []).find((assignment) => {
            const assignmentBatches = this.batchValues(assignment.batch);
            return assignment.teacher && assignmentBatches.some((batch) => batches.includes(batch));
        });
        if (batchAssignment?.teacher) return batchAssignment.teacher;
        if (!subject.batchAssignments?.length && subject.teacher) return subject.teacher;
        if (!subject.batchAssignments?.length && subject.teachers?.length === 1) return subject.teachers[0];
        return null;
    }

    rememberCollection(conversationId, entityType, items, setPending = true) {
        contextByConversation.set(conversationId, {
            entityType,
            items,
            selected: items.length === 1 ? items[0] : null,
            updatedAt: Date.now()
        });
        if (setPending && items.length) {
            pendingByConversation.set(conversationId, {
                type: 'item_detail',
                choices: items,
                createdAt: Date.now()
            });
        }
    }

    async answerFromContext(input, conversationId, traceId) {
        const lower = input.toLowerCase();
        const ctx = contextByConversation.get(conversationId);
        if (!ctx) return null;

        const asksPoster = includesAny(lower, ['who posted', 'posted this', 'posted it', 'uploaded by', 'who uploaded', 'who gave']);
        const asksDetails = includesAny(lower, ['tell me more', 'details', 'about this', 'about it', 'what is this']);

        if (!asksPoster && !asksDetails) return null;

        const item = ctx.selected || (ctx.items?.length === 1 ? ctx.items[0] : null);
        if (!item) {
            return this.reply('Please select one item first, then I can tell you its details.', { traceId });
        }

        if (asksPoster) {
            const by = item.postedBy || item.facultyName || 'I do not have the poster name for this item.';
            const role = item.postedByRole ? ` (${item.postedByRole})` : '';
            return this.reply(`It was posted by ${by}${role}.`, { traceId });
        }

        return this.getItemDetail(null, item.id, conversationId, traceId, item);
    }

    audienceFor(user) {
        if (!user?.role) return ['general', 'public'];
        if (user.role === 'student') return ['general', 'student'];
        if (user.role === 'hosteler') return ['general', 'student', 'hosteler'];
        if (user.role === 'teacher') return ['general', 'teacher'];
        if (user.role === 'hod') return ['general', 'teacher', 'student', 'hod'];
        if (user.role === 'warden') return ['general', 'hosteler', 'warden', 'student'];
        if (user.role === 'principal' || user.role === 'dean' || user.role === 'admin') return ['general', 'student', 'teacher', 'hosteler', 'hod', 'principal', 'warden'];
        return ['general', user.role];
    }

    collection(entityType, choices, message, traceId, semanticType = 'COLLECTION_VIEW') {
        return {
            version: 'v1',
            success: true,
            presentationState: choices.length ? 'SUCCESS' : 'EMPTY',
            action: 'AI_RESPONSE',
            semanticType,
            entityType,
            message,
            payload: { choices },
            timestamp: Date.now(),
            traceId
        };
    }

    reply(message, extra = {}) {
        return {
            version: 'v1',
            success: extra.success !== false,
            presentationState: extra.presentationState || 'SUCCESS',
            action: extra.action || 'AI_RESPONSE',
            message,
            payload: extra.payload || null,
            timestamp: Date.now(),
            traceId: extra.traceId || getTraceId()
        };
    }

    capabilityMessage(role, user = null) {
        const common = 'I can fetch notices, schedules, subjects, teachers, notes, assignments, complaint status, and submission status.';
        const identity = user?.name ? ` You are logged in as ${user.name} (${role}${user.designation ? `, ${user.designation}` : ''}).` : '';
        if (role === 'student' || role === 'hosteler') return `${identity} ${common} I can draft assignment responses, complaint forms, and eligible leave requests using your logged-in profile. You make the final submission.`;
        if (role === 'teacher') return `${identity} ${common} I can summarize your created assignments, student complaints, faculty schedule, and teaching records.`;
        return `${common} I can help review campus complaints, notices, staff data, and academic information.`;
    }

    buildProfileContext(user) {
        if (!user?._id) return 'Profile: guest user, not authenticated.';

        const parts = [
            `name=${user.name || 'Unknown'}`,
            `role=${user.role || 'unknown'}`,
            `designation=${user.designation || 'not set'}`,
            `department=${user.department || 'not set'}`,
            `year=${user.year || 'not set'}`,
            `semester=${user.semester || 'not set'}`,
            `batch=${user.batch || 'not set'}`,
            `section=${user.section || 'not set'}`,
            `subBatch=${user.subBatch || 'not set'}`,
            `rollNumber=${user.rollNumber || 'not set'}`,
            `employeeId=${user.employeeId || 'not set'}`,
            `subjects=${(user.subjects || user.teachingSubjects || []).join(', ') || 'not set'}`,
            `specialization=${user.specialization || 'not set'}`
        ];

        return `Authenticated profile: ${parts.join('; ')}.`;
    }

    titleFromText(text, category) {
        const compact = clean(text).split(/[.!?]/)[0].slice(0, 80);
        if (compact.length > 8) return compact;
        return `${category} Complaint`;
    }

    allowed(value, list, fallback) {
        const found = list.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
        return found || fallback;
    }

    requireUser(user) {
        if (!user?._id) throw new Error('Login required.');
    }

    requireRole(user, roles, message) {
        this.requireUser(user);
        if (!roles.includes(user.role)) throw new Error(message);
    }

    safeHistory(history = []) {
        return history.slice(-6).filter((item) => ['user', 'assistant'].includes(item.role)).map((item) => ({
            role: item.role,
            content: clean(item.content).slice(0, 1200)
        }));
    }

    async llmText(messages, fallback) {
        if (!this.groq) return fallback;
        try {
            const response = await this.groq.chat.completions.create({
                model: this.model,
                messages,
                temperature: 0.3,
                max_tokens: 900
            });
            return clean(response.choices?.[0]?.message?.content, fallback) || fallback;
        } catch (error) {
            console.warn('[CampusAgent] LLM text fallback:', error.message);
            return fallback;
        }
    }

    async llmJson(messages, fallback) {
        if (!this.groq) return fallback;
        try {
            const response = await this.groq.chat.completions.create({
                model: this.model,
                messages,
                temperature: 0.2,
                response_format: { type: 'json_object' },
                max_tokens: 700
            });
            const raw = response.choices?.[0]?.message?.content;
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.warn('[CampusAgent] LLM JSON fallback:', error.message);
            return fallback;
        }
    }

    async logAction({ traceId, conversationId, user, intent, status, args, errorMessage = null }) {
        try {
            await AIActionLog.create({
                traceId,
                conversationId,
                userId: user?._id,
                role: user?.role || 'guest',
                intent: String(intent || 'GENERAL').toUpperCase(),
                tool: 'campus_agent',
                inputText: args?.text,
                generatedArgs: args,
                executionStatus: status,
                confirmationStatus: status === EXECUTION_STATUS.COMPLETED ? CONFIRMATION_STATUS.CONFIRMED : CONFIRMATION_STATUS.PENDING,
                errorMessage,
                metrics: { modelName: this.groq ? this.model : 'deterministic-fallback', promptVersion: 'campus-agent-v1' }
            });
        } catch (error) {
            console.warn('[CampusAgent] Action log skipped:', error.message);
        }
    }
}

export default new CampusAgentService();
