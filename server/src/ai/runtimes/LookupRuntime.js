import Assignment from '../../models/Assignment.js';
import Complaint from '../../models/Complaint.js';
import Notice from '../../models/Notice.js';
import Note from '../../models/Note.js';
import Routine from '../../models/Routine.js';
import Subject from '../../models/Subject.js';
import Submission from '../../models/Submission.js';
import User from '../../models/User.js';
import Leave from '../../models/Leave.js';
import Book from '../../models/Book.js';
import LibraryTransaction from '../../models/LibraryTransaction.js';
import AIActionLog from '../../models/AIActionLog.js';

const norm = (value) => String(value || '').toLowerCase();
const hasAny = (text, words) => words.some(word => text.includes(word));
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const subjectAliases = [
    { keys: ['dbms', 'database management system', 'database management systems'], canonical: 'Database Management System' },
    { keys: ['os', 'operating system', 'operating systems'], canonical: 'Operating System' },
    { keys: ['cn', 'computer network', 'computer networks'], canonical: 'Computer Networks' },
    { keys: ['it', 'internet technology'], canonical: 'Internet Technology' },
    { keys: ['pme', 'project management', 'entrepreneurship', 'project management & entrepreneurship'], canonical: 'Project Management & Entrepreneurship' },
    { keys: ['cyber security', 'cybersecurity', 'cyber sec', 'cs', 'security', 'computer security'], canonical: 'Cyber Security' },
    { keys: ['soft skills', 'soft skill'], canonical: 'Soft Skills' },
    { keys: ['physics', 'physics for engineers'], canonical: 'Physics for Engineers' }
];

const resolveSubject = (text) => {
    const lower = norm(text);
    const found = subjectAliases.find(item => item.keys.some(key => new RegExp(`\\b${escapeRegex(key)}\\b`, 'i').test(lower)));
    return found?.canonical || null;
};

const subjectRegex = (subject) => {
    if (!subject) return null;
    const alias = subjectAliases.find(item => item.canonical === subject);
    const values = [subject, ...(alias?.keys || [])].filter(Boolean).map(escapeRegex);
    return new RegExp(values.join('|'), 'i');
};

const batchValues = (batch) => {
    const raw = String(batch || '').trim();
    if (!raw) return [];
    const digits = raw.match(/\d+/)?.[0];
    return [...new Set([raw, raw.toLowerCase(), digits, digits ? `Batch ${digits}` : null, digits ? `batch ${digits}` : null].filter(Boolean))];
};

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const resolveDay = (text, clientContext = {}) => {
    const lower = norm(text);
    const explicit = dayNames.find(day => lower.includes(day.toLowerCase()));
    if (explicit) return explicit;
    const todayIndex = Number.isInteger(clientContext.dayIndex)
        ? clientContext.dayIndex
        : (new Date(clientContext.isoDate || Date.now()).getDay() + 6) % 7;
    if (hasAny(lower, ['today', "today's", 'todays'])) return dayNames[todayIndex];
    if (hasAny(lower, ['tomorrow', "tomorrow's"])) return dayNames[(todayIndex + 1) % 7];
    return null;
};

const collection = (entityType, choices, message, semanticType = 'COLLECTION_VIEW') => ({
    version: 'v1',
    success: true,
    presentationState: choices.length ? 'SUCCESS' : 'EMPTY',
    action: 'AI_RESPONSE',
    semanticType,
    entityType,
    message,
    payload: { choices },
    timestamp: Date.now()
});

const response = (message, payload = {}, semanticType = 'AI_RESPONSE') => ({
    version: 'v1',
    success: true,
    presentationState: 'SUCCESS',
    action: 'AI_RESPONSE',
    semanticType,
    entityType: semanticType,
    message,
    payload,
    timestamp: Date.now()
});

const denied = (message) => ({
    version: 'v1',
    success: false,
    presentationState: 'FAILED',
    action: 'AI_RESPONSE',
    semanticType: 'POLICY_DENIAL',
    entityType: 'POLICY_DENIAL',
    message,
    payload: {},
    timestamp: Date.now()
});

const percentage = (part, total) => total ? Number(((part / total) * 100).toFixed(1)) : 0;

const statusCount = (items, predicate) => items.filter(predicate).length;

const uniqueById = (items) => {
    const seen = new Set();
    return items.filter((item) => {
        const id = String(item?._id || item?.id || item?.student?._id || item?.student || '');
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
    });
};

const dayRange = (clientContext = {}) => {
    const start = new Date(clientContext.isoDate || Date.now());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
};

const departmentAliases = {
    it: ['IT', 'Information Technology', 'Info Tech'],
    cse: ['CSE', 'Computer Science', 'Computer Science Engineering'],
    ece: ['ECE', 'Electronics', 'Electronics and Communication'],
    ee: ['EE', 'Electrical'],
    me: ['ME', 'Mechanical'],
    ce: ['CE', 'Civil']
};

const departmentFilterFor = (department) => {
    const raw = String(department || '').trim();
    if (!raw) return null;
    const lower = raw.toLowerCase();
    const values = departmentAliases[lower] || Object.values(departmentAliases).find(list => list.some(item => item.toLowerCase() === lower)) || [raw];
    return new RegExp(`^(${values.map(escapeRegex).join('|')})$`, 'i');
};

const lastLookupByUser = new Map();

const targetMatchesUser = (item = {}, user = {}) => {
    const audience = norm(item.audience || 'general');
    const hasSpecificTarget = Boolean(item.targetDept || item.targetYear || item.targetBatch || item.targetSubBatch);
    if (item.targetDept && norm(item.targetDept) !== norm(user.department)) return false;
    if (item.targetYear && norm(item.targetYear) !== norm(user.year)) return false;
    if (item.targetBatch && norm(item.targetBatch) !== norm(user.batch)) return false;
    if (item.targetSubBatch && norm(item.targetSubBatch) !== norm(user.subBatch)) return false;
    if (hasSpecificTarget) return true;
    if (!audience || audience === 'general') return true;
    if (audience === norm(user.role)) return true;
    if (audience === 'student' && ['student', 'hosteler'].includes(user.role)) return true;
    if (audience === 'hosteler' && user.role === 'hosteler') return true;
    return false;
};

class LookupRuntime {
    canHandle(text) {
        const lower = norm(text);
        return hasAny(lower, [
            'show', 'view', 'open', 'list', 'find', 'search', 'status', 'track', 'how many',
            'pending', 'overdue', 'due tomorrow', 'deadline', 'deadlines', 'notes', 'routine',
            'schedule', 'teacher', 'teaches', 'hod', 'head of department', 'department head', 'mentor',
            'complaints', 'assignments', 'notices', 'holiday', 'attendance', 'which', 'who',
            'department', 'faculty', 'students', 'analytics', 'statistics', 'summary', 'report',
            'hostel', 'room', 'rooms', 'vacant', 'occupancy', 'leave', 'sos', 'emergency',
            'mentees', 'counselling', 'library', 'book', 'books', 'exam', 'placement', 'hall ticket',
            'seating plan', 'companies', 'backlog'
        ]) || Boolean(resolveSubject(lower));
    }

    async handle(text, { user, clientContext = {} } = {}) {
        const lower = norm(text);
        const followUp = this.handleFollowUpAction(text, user);
        if (followUp) return followUp;
        if (user?.role === 'teacher') return this.teacher(text, user, clientContext);
        if (user?.role === 'principal' || user?.role === 'dean' || user?.role === 'admin') return this.principal(text, user, clientContext);
        if (user?.role === 'hod') return this.hod(text, user, clientContext);
        if (user?.role === 'warden') return this.warden(text, user, clientContext);
        if (user?.role === 'librarian') return this.librarian(text, user, clientContext);
        if (this.isMentorQuery(lower, user)) return this.mentor(text, user, clientContext);
        if (this.isExamOrPlacementQuery(lower)) return this.examPlacement(text, user, clientContext);
        const wantsNotes = hasAny(lower, ['note', 'notes', 'material']);
        const wantsRoutine = hasAny(lower, ['routine', 'schedule', 'lecture', 'class']);
        const wantsAssignments = hasAny(lower, ['assignment', 'assignments', 'deadline', 'deadlines', 'due tomorrow', 'overdue', 'pending']);
        const wantsNotices = hasAny(lower, ['notice', 'notices', 'holiday', 'holidays']);
        const wantsTeachers = hasAny(lower, ['teacher', 'teachers', 'faculty', 'teaches']);
        const wantsComplaints = hasAny(lower, ['complaint', 'complaints', 'unresolved']);
        const multi = [
            wantsAssignments && 'assignments',
            wantsNotices && 'notices',
            wantsNotes && 'notes',
            wantsRoutine && 'routine',
            wantsTeachers && 'teachers',
            wantsComplaints && 'complaints',
            lower.includes('attendance') && 'attendance'
        ].filter(Boolean);
        if (multi.length > 1) return this.multi(text, user, clientContext, multi);

        if (hasAny(lower, ['assignment', 'assignments', 'deadline', 'deadlines', 'due tomorrow', 'overdue'])) {
            return this.assignments(text, user);
        }
        if (hasAny(lower, ['notice', 'notices', 'holiday', 'holidays'])) return this.notices(text, user);
        if (hasAny(lower, ['note', 'notes', 'material'])) return this.notes(text, user);
        if (hasAny(lower, ['routine', 'schedule', 'lecture', 'class'])) return this.routine(text, user, clientContext);
        if (hasAny(lower, ['teacher', 'faculty', 'teaches'])) return this.teachers(text, user);
        if (hasAny(lower, ['hod', 'head of department', 'department head', 'mentor'])) return this.peopleInfo(text, user);
        if (hasAny(lower, ['complaint', 'complaints', 'unresolved'])) return this.complaints(text, user);
        if (lower.includes('attendance')) {
            return collection('NAVIGATION', [{ title: 'Attendance', path: '/modules/attendance/view.html', entityType: 'NAVIGATION' }], 'Opening attendance module.', 'NAVIGATION');
        }
        return null;
    }

    handleFollowUpAction(text, user = {}) {
        const lower = norm(text);
        if (!hasAny(lower, ['send', 'message', 'notice', 'notify', 'wp', 'whatsapp'])) return null;
        const remembered = lastLookupByUser.get(String(user?._id || ''));
        if (!remembered?.choices?.length) return null;
        const channel = lower.includes('wp') || lower.includes('whatsapp')
            ? 'WhatsApp'
            : lower.includes('notice')
                ? 'Notice'
                : null;
        const names = remembered.choices.map(item => item.title).filter(Boolean);
        const draft = remembered.type === 'pendingGrading'
            ? `Dear Faculty,\n\nPlease complete the pending assignment evaluations assigned to you at the earliest. Timely grading helps students receive feedback and allows the department to close pending academic records.\n\nRegards,\n${user?.name || 'Department Office'}`
            : `Dear Student,\n\nYour current academic record requires attention. Please improve your attendance, clear pending academic work, and meet your mentor/HOD if you need support.\n\nRegards,\n${user?.name || 'Department Office'}`;
        return response(channel
            ? `${channel} draft prepared for ${names.length} recipient${names.length === 1 ? '' : 's'}.\nRecipients: ${names.join(', ')}\n\n${draft}\n\nFinal sending must be confirmed from the ${channel === 'WhatsApp' ? 'outreach' : 'notice'} module.`
            : `How should I contact these ${names.length} recipient${names.length === 1 ? '' : 's'}: WhatsApp message or notice?\n\nSuggested draft:\n${draft}`, {
                recipients: remembered.choices,
                draft,
                channel,
                source: remembered.type
            }, 'OUTREACH_DRAFT');
    }

    async teacher(text, user = {}, clientContext = {}) {
        const lower = norm(text);
        const blocked = [
            { keys: ['approve principal notice', 'principal notice'], message: 'Teachers cannot approve Principal notices.' },
            { keys: ['delete student', 'remove student'], message: 'Teachers cannot delete students.' },
            { keys: ['reset database', 'reset db'], message: 'Teachers cannot reset the database.' },
            { keys: ['change password', 'reset password'], message: 'Teachers cannot change passwords through the AI assistant.' },
            { keys: ['create hod notice', 'hod notice'], message: 'Teachers cannot create HOD notices.' },
            { keys: ['principal analytics'], message: 'Teachers cannot access Principal analytics.' }
        ].find(rule => hasAny(lower, rule.keys));
        if (blocked) return denied(blocked.message);

        const nav = this.teacherNavigation(lower);
        if (nav) return nav;

        if (this.isMentorQuery(lower, user) || hasAny(lower, ['my mentees', 'rahul'])) return this.mentor(text, user, clientContext);
        if (lower.includes(' and ') && (lower.includes('complaint') || lower.includes('notice') || lower.includes('attendance'))) return this.teacherMulti(text, user, clientContext);
        if (hasAny(lower, ['recommend', 'what should i finish', 'what should i review', 'what is pending', 'need attention', 'review first'])) {
            return this.teacherRecommendations(text, user, clientContext);
        }
        if (hasAny(lower, ["hasn't submitted", 'has not submitted', 'not submitted assignments', 'pending students'])) return this.studentsMissingSubmissions(text, user);
        if (hasAny(lower, ['how many', 'statistics', 'analytics', 'percentage', 'count', 'counts', 'submitted', 'late', 'pending'])) {
            if (lower.includes('student') || lower.includes('attendance') || lower.includes('absent') || lower.includes('performer')) return this.teacherStudents(text, user);
            if (lower.includes('complaint')) return this.teacherComplaints(text, user);
            if (lower.includes('notice')) return this.teacherNotices(text, user);
            if (lower.includes('leave')) return this.teacherLeaves(text, user);
            return this.teacherAssignmentStats(text, user);
        }
        if (hasAny(lower, ['assignment', 'assignments', 'evaluation', 'evaluations'])) return this.teacherAssignments(text, user);
        if (hasAny(lower, ['notice', 'notices'])) return this.teacherNotices(text, user);
        if (hasAny(lower, ['note', 'notes', 'material'])) return this.teacherNotes(text, user);
        if (hasAny(lower, ['student', 'students', 'attendance', 'performer'])) return this.teacherStudents(text, user);
        if (hasAny(lower, ['leave', 'leaves'])) return this.teacherLeaves(text, user);
        if (hasAny(lower, ['complaint', 'complaints'])) return this.teacherComplaints(text, user);
        if (hasAny(lower, ['routine', 'schedule', 'timetable', 'next class', 'free period', 'today', 'tomorrow'])) return this.teacherRoutine(text, user, clientContext);
        if (hasAny(lower, ['subject', 'subjects', 'teaches', 'faculty', 'teacher'])) return this.teacherSubjects(text, user);
        if (hasAny(lower, ['hod', 'head of department'])) return this.teacherHod(user);
        if (hasAny(lower, ['event', 'events', 'meeting', 'meetings', 'report', 'reports', 'result', 'results'])) {
            return response('Teacher module records are database-backed. No matching records exist yet for this request.', { stats: {} }, 'TEACHER_EMPTY');
        }
        return response('No teacher records matched this request.', { stats: {} }, 'TEACHER_EMPTY');
    }

    teacherNavigation(lower) {
        if (!hasAny(lower, ['open', 'go to', 'goto'])) return null;
        const targets = [
            ['attendance', 'Attendance', '/modules/attendance/view.html'],
            ['assignment', 'Assignments', '/modules/assignments/view.html'],
            ['note', 'Notes', '/modules/assignments/view.html?type=notes'],
            ['student', 'Students', '/teacher/mentees.html'],
            ['notice', 'Notices', '/modules/notices/view.html'],
            ['complaint', 'Complaints', '/modules/complaints/view.html'],
            ['leave', 'Leave', '/teacher/index.html#leaves'],
            ['report', 'Reports', '/teacher/index.html#reports'],
            ['dashboard', 'Dashboard', '/teacher/index.html']
        ];
        const target = targets.find(([key]) => lower.includes(key));
        if (!target) return null;
        return collection('NAVIGATION', [{ title: target[1], path: target[2], entityType: 'NAVIGATION' }], `Opening ${target[1]}.`, 'NAVIGATION');
    }

    async teacherAssignmentStats(text, user) {
        const assignments = await Assignment.find({ teacher: user._id, type: { $ne: 'note' } }).lean();
        const assignmentIds = assignments.map(item => item._id);
        const submissions = await Submission.find({ assignment: { $in: assignmentIds } }).lean();
        const now = new Date();
        const published = assignments.length;
        const pendingEvaluations = statusCount(submissions, item => item.status === 'Pending');
        const late = submissions.filter(sub => {
            const assignment = assignments.find(item => String(item._id) === String(sub.assignment));
            return assignment?.deadline && new Date(sub.submittedAt) > new Date(assignment.deadline);
        }).length;
        const dueToday = assignments.filter(item => {
            if (!item.deadline) return false;
            const d = new Date(item.deadline);
            return d.toDateString() === now.toDateString();
        }).length;
        const studentCount = await this.teacherStudentFilter(user).then(filter => User.countDocuments(filter));
        const totalExpected = published * studentCount;
        const submitted = submissions.length;
        const stats = {
            publishedAssignments: published,
            draftAssignments: 0,
            pendingReview: pendingEvaluations,
            dueToday,
            submitted,
            lateSubmissions: late,
            studentsPending: Math.max(totalExpected - submitted, 0),
            averageSubmission: percentage(submitted, totalExpected)
        };
        return response(`Published Assignments: ${stats.publishedAssignments}\nDraft Assignments: ${stats.draftAssignments}\nPending Review: ${stats.pendingReview}\nAverage Submission: ${stats.averageSubmission}%\nLate Submissions: ${stats.lateSubmissions}\nStudents Pending: ${stats.studentsPending}`, { stats }, 'ASSIGNMENT_ANALYTICS');
    }

    async teacherAssignments(text, user) {
        if (hasAny(norm(text), ['how many', 'statistics', 'analytics', 'submitted', 'late', 'pending'])) return this.teacherAssignmentStats(text, user);
        const subject = resolveSubject(text);
        const filter = { teacher: user._id, type: { $ne: 'note' } };
        if (subject) filter.subject = subjectRegex(subject);
        const assignments = await Assignment.find(filter).sort({ deadline: 1 }).limit(10).lean();
        const choices = assignments.map(item => ({
            id: item._id.toString(),
            title: item.title,
            subject: item.subject,
            deadline: item.deadline,
            entityType: 'ASSIGNMENT',
            path: `/modules/assignments/view.html?assignmentId=${item._id.toString()}`
        }));
        return collection('ASSIGNMENT', choices, choices.length ? 'Your assignment records are listed below.' : 'No teacher assignment records matched this request.');
    }

    async teacherStudentFilter(user) {
        const filter = { role: { $in: ['student', 'hosteler'] } };
        if (user.department) filter.department = user.department;
        if (user._id) filter.assignedTeachers = user._id;
        return filter;
    }

    async teacherStudents(text, user) {
        const filter = await this.teacherStudentFilter(user);
        let students = await User.find(filter).sort({ name: 1 }).limit(20).lean();
        if (!students.length) {
            const fallback = { role: { $in: ['student', 'hosteler'] } };
            if (user.department) fallback.department = user.department;
            students = await User.find(fallback).sort({ name: 1 }).limit(20).lean();
        }
        const total = await User.countDocuments(students.length ? { _id: { $in: students.map(s => s._id) } } : filter);
        const lowAttendance = students.filter(item => Number(item.attendance || 0) < 75).length;
        const topPerformers = students.filter(item => Number(item.cgpa || 0) >= 8).length;
        const stats = {
            totalStudents: total,
            absentOrLowAttendance: lowAttendance,
            attendancePercentage: percentage(students.reduce((sum, item) => sum + Number(item.attendance || 0), 0), students.length * 100),
            topPerformers,
            pendingAssignments: students.filter(item => Number(item.assignmentsSubmitted || 0) === 0).length
        };
        return response(`Total Students: ${stats.totalStudents}\nLow Attendance: ${stats.absentOrLowAttendance}\nAverage Attendance: ${stats.attendancePercentage}%\nTop Performers: ${stats.topPerformers}\nPending Assignments: ${stats.pendingAssignments}`, { stats, choices: students.map(s => ({ id: s._id.toString(), title: s.name, rollNumber: s.rollNumber, attendance: s.attendance, cgpa: s.cgpa, entityType: 'STUDENT' })) }, 'STUDENT_ANALYTICS');
    }

    async teacherNotes(text, user) {
        const filter = { department: user.department };
        const subject = resolveSubject(text);
        if (subject) filter.$or = [{ topic: subjectRegex(subject) }, { subject: subjectRegex(subject) }, { description: subjectRegex(subject) }];
        const notes = await Note.find(filter).sort({ createdAt: -1 }).limit(10).lean();
        return collection('NOTE', notes.map(item => ({ id: item._id.toString(), title: item.topic || item.subject, subject: item.subject, fileUrl: item.fileUrl, entityType: 'NOTE', path: item.fileUrl || '/modules/assignments/view.html' })), notes.length ? 'Your note records are listed below.' : 'No teacher note records matched this request.');
    }

    async teacherNotices(text, user) {
        const notices = await Notice.find({ postedBy: user._id }).sort({ createdAt: -1 }).limit(20).lean();
        const stats = { published: notices.length, draft: 0, scheduled: notices.filter(n => n.date && new Date(n.date) > new Date()).length, engagement: 0 };
        if (hasAny(norm(text), ['how many', 'statistics', 'analytics', 'count'])) {
            return response(`Published Notices: ${stats.published}\nDraft Notices: ${stats.draft}\nScheduled Notices: ${stats.scheduled}\nNotice Engagement: ${stats.engagement}%`, { stats }, 'NOTICE_ANALYTICS');
        }
        return collection('NOTICE', notices.slice(0, 10).map(item => ({ id: item._id.toString(), title: item.title, subject: item.content, audience: item.audience, date: item.date || item.createdAt, entityType: 'NOTICE', path: `/modules/notices/view.html?noticeId=${item._id.toString()}` })), notices.length ? 'Your notice records are listed below.' : 'No teacher notice records matched this request.');
    }

    async teacherLeaves(text, user) {
        const students = await User.find(await this.teacherStudentFilter(user)).distinct('_id');
        const leaves = await Leave.find({ student: { $in: students } }).lean();
        const stats = {
            pending: statusCount(leaves, l => String(l.status).includes('Pending') || l.hodStatus === 'Pending'),
            approved: statusCount(leaves, l => String(l.status).includes('Approved') || l.hodStatus === 'Approved'),
            rejected: statusCount(leaves, l => String(l.status).includes('Rejected') || l.hodStatus === 'Rejected')
        };
        return response(`Pending Leave: ${stats.pending}\nApproved Leave: ${stats.approved}\nRejected Leave: ${stats.rejected}`, { stats }, 'LEAVE_ANALYTICS');
    }

    async teacherComplaints(text, user) {
        const students = await User.find(await this.teacherStudentFilter(user)).distinct('_id');
        const complaints = await Complaint.find({ student: { $in: students } }).lean();
        const stats = {
            pending: statusCount(complaints, c => ['Submitted', 'Viewed'].includes(c.status)),
            assigned: statusCount(complaints, c => c.assignedStaff || c.status === 'In Progress'),
            resolved: statusCount(complaints, c => c.status === 'Resolved')
        };
        return response(`Pending Complaints: ${stats.pending}\nAssigned Complaints: ${stats.assigned}\nResolved Complaints: ${stats.resolved}`, { stats }, 'COMPLAINT_ANALYTICS');
    }

    async teacherRoutine(text, user, clientContext) {
        const filter = { teacher: user._id };
        const day = resolveDay(text, clientContext);
        if (day) filter.day = day;
        const routines = await Routine.find(filter).populate('subject', 'name code').sort({ day: 1, period: 1, timeSlot: 1 }).limit(10).lean();
        const choices = routines.map(item => ({ id: item._id.toString(), title: `${item.day} ${item.timeSlot}`, subject: item.subject?.name || item.subjectName, room: item.room, batch: item.batch, entityType: 'SCHEDULE', path: '/modules/routine/view.html' }));
        return collection('SCHEDULE', choices, choices.length ? 'Your teacher timetable records are listed below.' : 'No timetable records matched this request.', 'SCHEDULE_VIEW');
    }

    async teacherSubjects(text, user) {
        const subject = resolveSubject(text);
        if (hasAny(norm(text), ['who teaches', 'faculty', 'teacher']) && subject) {
            const regex = subjectRegex(subject);
            const teachers = await User.find({ role: { $in: ['teacher', 'hod'] }, $or: [{ teachingSubjects: regex }, { subjects: regex }] }).limit(10).lean();
            return collection('TEACHER', teachers.map(item => ({ id: item._id.toString(), title: item.name, email: item.email, department: item.department, cabin: item.availabilitySlots?.[0] || '', subjects: item.teachingSubjects || item.subjects || [], entityType: 'TEACHER' })), teachers.length ? 'Faculty records are listed below.' : 'No faculty records matched that subject.');
        }
        const subjects = user.teachingSubjects || user.subjects || [];
        return response(`Subjects Assigned: ${subjects.length}\n${subjects.map(s => `- ${s}`).join('\n')}`, { stats: { assignedSubjects: subjects.length }, subjects }, 'SUBJECT_ANALYTICS');
    }

    async teacherHod(user) {
        const hod = await User.findOne({ role: 'hod', department: user.department }).lean();
        if (!hod) return response('No HOD record exists for your department.', { stats: {} }, 'TEACHER_EMPTY');
        return response(`Name: ${hod.name}\nDepartment: ${hod.department || ''}\nDesignation: ${hod.designation || 'Head of Department'}\nEmail: ${hod.email || ''}\nPhone: ${hod.contactNumber || ''}`, { hod }, 'HOD_LOOKUP');
    }

    async teacherRecommendations(text, user, clientContext) {
        const assignmentStats = await this.teacherAssignmentStats(text, user);
        const routine = await this.teacherRoutine('today timetable', user, clientContext);
        return response(`What should you finish today:\n${assignmentStats.message}\n\nToday's Workload: ${(routine.payload?.choices || []).length} classes`, {
            assignmentStats: assignmentStats.payload?.stats,
            workload: routine.payload?.choices || []
        }, 'TEACHER_RECOMMENDATION');
    }

    async teacherMulti(text, user, clientContext) {
        const lower = norm(text);
        const sections = [];
        if (lower.includes('complaint')) sections.push(await this.teacherComplaints(text, user));
        if (lower.includes('notice')) sections.push(await this.teacherNotices(text, user));
        if (lower.includes('attendance') || lower.includes('weak students')) sections.push(await this.teacherStudents(text, user));
        return response(sections.map(section => section.message).join('\n\n'), {
            sections: sections.map(section => ({ semanticType: section.semanticType, payload: section.payload }))
        }, 'TEACHER_MULTI_RESULT');
    }

    async studentsMissingSubmissions(text, user) {
        const filter = await this.teacherStudentFilter(user);
        let students = await User.find(filter).sort({ name: 1 }).lean();
        if (!students.length) {
            const fallback = { role: { $in: ['student', 'hosteler'] } };
            if (user.department) fallback.department = user.department;
            students = await User.find(fallback).sort({ name: 1 }).lean();
        }
        const assignments = await Assignment.find({ teacher: user._id, type: { $ne: 'note' } }).lean();
        const submissions = await Submission.find({ assignment: { $in: assignments.map(a => a._id) } }).lean();
        const submittedByStudent = new Map();
        submissions.forEach((submission) => {
            const key = String(submission.student);
            submittedByStudent.set(key, (submittedByStudent.get(key) || 0) + 1);
        });
        const missing = students.filter(student => (submittedByStudent.get(String(student._id)) || 0) < assignments.length).slice(0, 20);
        return collection('STUDENT', missing.map(s => ({
            id: s._id.toString(),
            title: s.name,
            rollNumber: s.rollNumber,
            submittedAssignments: submittedByStudent.get(String(s._id)) || 0,
            expectedAssignments: assignments.length,
            entityType: 'STUDENT'
        })), missing.length ? `Students missing submissions: ${missing.length} of ${students.length}\nExpected Assignments Per Student: ${assignments.length}` : 'Every assigned student has submitted the current assignment set.');
    }

    isMentorQuery(lower, user = {}) {
        return ['teacher', 'hod', 'principal', 'dean'].includes(user?.role) && hasAny(lower, ['mentee', 'mentees', 'counselling', 'counseling', 'parent meeting', 'mentor meeting', 'academic progress', 'at risk', 'weak performers']);
    }

    isExamOrPlacementQuery(lower) {
        return hasAny(lower, ['exam', 'hall ticket', 'seating plan', 'timetable', 'placement', 'infosys', 'upcoming companies', 'backlog']);
    }

    async principal(text, user, clientContext) {
        const lower = norm(text);
        const blocked = [
            { keys: ['reset database', 'reset db', 'drop database'], message: 'Database resets are not allowed through the AI assistant.' },
            { keys: ['delete principal notice'], message: 'Notice deletion must be done manually from the authorized notice module.' }
        ].find(rule => hasAny(lower, rule.keys));
        if (blocked) return denied(blocked.message);

        if (hasAny(lower, ['create', 'publish', 'schedule', 'notify']) && lower.includes('notice')) {
            return response('I can prepare a notice draft for Principal review. Nothing is published directly from this lookup response.', {
                redirect: '/modules/notices/create.html',
                entity: 'notice'
            }, 'NOTICE_DRAFT_GUIDANCE');
        }
        if (hasAny(lower, ['which department has the most complaints', 'most complaints'])) return this.complaintDepartmentRanking(text, user);
        if (hasAny(lower, ['faculty', 'workload', 'inactive'])) return this.facultyAnalytics(text, user);
        if (hasAny(lower, ['complaint', 'complaints', 'disciplinary'])) return this.institutionComplaints(text, user);
        if (hasAny(lower, ['department', 'analytics', 'statistics', 'summary', 'dashboard', 'attendance', 'performance', 'approvals', 'report', 'students enrolled', 'how many students'])) {
            return this.institutionAnalytics(text, user);
        }
        if (hasAny(lower, ['which department needs attention', 'needs attention'])) {
            const complaints = await Complaint.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 1 }]);
            return response(`Department needing attention: ${complaints[0]?._id || 'No department flagged'}${complaints[0] ? ` (${complaints[0].count} complaints)` : ''}`, { recommendation: complaints[0] || null }, 'PRINCIPAL_RECOMMENDATION');
        }
        return this.institutionAnalytics(text, user);
    }

    async institutionAnalytics(text, user) {
        const lower = norm(text);
        const [students, faculty, complaints, notices, leaves] = await Promise.all([
            User.countDocuments({ role: { $in: ['student', 'hosteler'] } }),
            User.countDocuments({ role: { $in: ['teacher', 'hod'] } }),
            Complaint.find({}).lean(),
            Notice.countDocuments({}),
            Leave.find({}).lean()
        ]);
        const unresolved = statusCount(complaints, c => c.status !== 'Resolved');
        const pendingLeaves = statusCount(leaves, l => l.hodStatus === 'Pending' || l.wardenStatus === 'Pending');
        const departments = await User.aggregate([{ $match: { role: { $in: ['student', 'hosteler'] } } }, { $group: { _id: '$department', students: { $sum: 1 }, avgAttendance: { $avg: '$attendance' }, avgCgpa: { $avg: '$cgpa' } } }, { $sort: { students: -1 } }]);
        const stats = { students, faculty, unresolvedComplaints: unresolved, notices, pendingApprovals: pendingLeaves, departments };
        if (lower.includes('department') || lower.includes('performs best')) {
            const ranked = [...departments].sort((a, b) => ((b.avgCgpa || 0) + ((b.avgAttendance || 0) / 100)) - ((a.avgCgpa || 0) + ((a.avgAttendance || 0) / 100)));
            return response(ranked.length
                ? `Best Department: ${ranked[0]._id || 'Unassigned'}\nAverage CGPA: ${Number((ranked[0].avgCgpa || 0).toFixed(2))}\nAverage Attendance: ${percentage(ranked[0].avgAttendance || 0, 100)}%\nStudents: ${ranked[0].students}`
                : 'No department performance data is available yet.', { stats, departments: ranked }, 'DEPARTMENT_ANALYTICS');
        }
        if (lower.includes('attendance')) {
            const avgAttendance = await User.aggregate([{ $match: { role: { $in: ['student', 'hosteler'] } } }, { $group: { _id: null, avg: { $avg: '$attendance' }, below75: { $sum: { $cond: [{ $lt: ['$attendance', 75] }, 1, 0] } } } }]);
            const row = avgAttendance[0] || {};
            return response(`Average Attendance: ${percentage(row.avg || 0, 100)}%\nStudents Below 75%: ${row.below75 || 0}\nTotal Students: ${students}`, { stats: { ...stats, attendance: row } }, 'ATTENDANCE_ANALYTICS');
        }
        return response(`Students Enrolled: ${students}\nFaculty: ${faculty}\nUnresolved Complaints: ${unresolved}\nPending Approvals: ${pendingLeaves}\nPublished Notices: ${notices}`, { stats }, 'INSTITUTION_ANALYTICS');
    }

    async institutionComplaints(text, user) {
        const lower = norm(text);
        const filter = {};
        if (lower.includes('unresolved')) filter.status = { $ne: 'Resolved' };
        if (lower.includes('disciplinary')) filter.category = /disciplinary/i;
        if (hasAny(lower, ['this week', 'week'])) {
            const start = new Date();
            start.setDate(start.getDate() - 7);
            filter.createdAt = { $gte: start };
        }
        const complaints = await Complaint.find(filter).populate('student', 'name department hostelName roomNumber').sort({ createdAt: -1 }).limit(20).lean();
        const byDept = complaints.reduce((acc, item) => {
            const key = item.student?.department || 'Unassigned';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        return collection('COMPLAINT', complaints.map(c => ({ id: c._id.toString(), title: c.title, status: c.status, category: c.category, priority: c.priority, department: c.student?.department, studentName: c.student?.name, entityType: 'COMPLAINT', path: `/modules/complaints/view.html?complaintId=${c._id.toString()}` })), complaints.length ? `Found ${complaints.length} complaint records. Department counts: ${Object.entries(byDept).map(([k, v]) => `${k}: ${v}`).join(', ') || 'none'}.` : 'No matching complaints found.');
    }

    async complaintDepartmentRanking(text, user) {
        const complaints = await Complaint.find({}).populate('student', 'department').lean();
        const counts = complaints.reduce((acc, complaint) => {
            const dept = complaint.student?.department || 'Unassigned';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {});
        const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return response(ranked.length ? `Department with Most Complaints: ${ranked[0][0]}\nComplaint Count: ${ranked[0][1]}\nAll Departments: ${ranked.map(([dept, count]) => `${dept}: ${count}`).join(', ')}` : 'No complaint records are available for department ranking.', { ranked }, 'COMPLAINT_DEPARTMENT_ANALYTICS');
    }

    async facultyAnalytics(text, user) {
        const filter = { role: { $in: ['teacher', 'hod'] } };
        const deptFilter = user?.role === 'hod' ? departmentFilterFor(user.department) : null;
        if (deptFilter) filter.department = deptFilter;
        const faculty = await User.find(filter).sort({ weeklyLoad: -1, name: 1 }).limit(20).lean();
        const inactive = faculty.filter(f => !Number(f.weeklyLoad || 0));
        const avgLoad = faculty.length ? Number((faculty.reduce((sum, f) => sum + Number(f.weeklyLoad || 0), 0) / faculty.length).toFixed(1)) : 0;
        const choices = faculty.map(f => ({ id: f._id.toString(), title: f.name, department: f.department, weeklyLoad: f.weeklyLoad || 0, attendance: f.attendance || 0, entityType: 'TEACHER' }));
        lastLookupByUser.set(String(user?._id || ''), { type: 'faculty', choices, at: Date.now() });
        return response(`Faculty Count: ${faculty.length}\nDepartment: ${user?.department || 'All'}\nHighest Workload: ${faculty[0]?.name || 'No faculty'} (${faculty[0]?.weeklyLoad || 0})\nInactive Faculty: ${inactive.length}\nAverage Attendance: ${percentage(faculty.reduce((sum, f) => sum + Number(f.attendance || 0), 0), faculty.length * 100)}%`, {
            stats: { faculty: faculty.length, inactive: inactive.length, averageWeeklyLoad: avgLoad },
            choices
        }, 'FACULTY_ANALYTICS');
    }

    async hod(text, user, clientContext) {
        const lower = norm(text);
        if (hasAny(lower, ['delete principal notice', 'reset database'])) return denied('HOD accounts cannot perform that administrative action through AI.');
        if (hasAny(lower, ['assignment', 'evaluations', 'evaluation', 'grading', 'completion'])) return this.departmentAssignments(text, user);
        if (hasAny(lower, ['teacher', 'faculty', 'workload', 'overloaded'])) return this.facultyAnalytics(text, { ...user, department: user.department });
        if (hasAny(lower, ['weak', 'toppers', 'below 75', 'attendance', 'students'])) return this.departmentStudents(text, user);
        if (hasAny(lower, ['complaint', 'assign complaint', 'escalate complaint'])) return this.departmentComplaints(text, user);
        if (this.isMentorQuery(lower, user)) return this.mentor(text, user, clientContext);
        return this.departmentStudents(text, user);
    }

    async departmentStudents(text, user) {
        const lower = norm(text);
        const filter = { role: { $in: ['student', 'hosteler'] } };
        const deptFilter = departmentFilterFor(user.department);
        if (deptFilter) filter.department = deptFilter;
        if (lower.includes('below 75') || lower.includes('weak')) filter.attendance = { $lt: 75 };
        if (lower.includes('toppers')) filter.cgpa = { $gte: 8 };
        const students = await User.find(filter).sort(lower.includes('toppers') ? { cgpa: -1 } : { attendance: 1, name: 1 }).limit(20).lean();
        const avgAttendance = percentage(students.reduce((sum, s) => sum + Number(s.attendance || 0), 0), students.length * 100);
        const lowAttendance = students.filter(s => Number(s.attendance || 0) < 75).length;
        const weakCgpa = students.filter(s => Number(s.cgpa || 0) < 6).length;
        const withBacklogs = students.filter(s => Number(s.backlogs || 0) > 0).length;
        const criteria = lower.includes('toppers')
            ? 'Criteria: CGPA 8.0 or above, sorted by CGPA.'
            : 'Criteria: attendance below 75%, CGPA below 6.0, or active backlogs; sorted by highest risk first.';
        const choices = students.map(s => ({
            id: s._id.toString(),
            title: s.name,
            rollNumber: s.rollNumber,
            attendance: s.attendance,
            cgpa: s.cgpa,
            backlogs: s.backlogs,
            reason: [
                Number(s.attendance || 0) < 75 ? `Attendance ${s.attendance || 0}%` : null,
                Number(s.cgpa || 0) < 6 ? `CGPA ${s.cgpa || 0}` : null,
                Number(s.backlogs || 0) > 0 ? `${s.backlogs} backlog(s)` : null
            ].filter(Boolean).join(', '),
            entityType: 'STUDENT'
        }));
        lastLookupByUser.set(String(user?._id || ''), { type: 'weakStudents', choices, at: Date.now() });
        return collection('STUDENT', choices, students.length ? `${criteria}\nMatched Students: ${students.length}\nAverage Attendance: ${avgAttendance}%\nBelow 75% Attendance: ${lowAttendance}\nCGPA Below 6.0: ${weakCgpa}\nWith Backlogs: ${withBacklogs}` : 'No matching students found.');
    }

    async departmentAssignments(text, user) {
        const lower = norm(text);
        const teacherFilter = { role: { $in: ['teacher', 'hod'] } };
        const deptFilter = departmentFilterFor(user.department);
        if (deptFilter) teacherFilter.department = deptFilter;
        const teachers = await User.find(teacherFilter).distinct('_id');
        const assignments = await Assignment.find({ teacher: { $in: teachers }, type: { $ne: 'note' } }).lean();
        const submissions = await Submission.find({ assignment: { $in: assignments.map(a => a._id) } }).lean();
        const pending = statusCount(submissions, s => s.status === 'Pending');
        if (hasAny(lower, ['which faculty', 'pending grading', 'pending evaluation', 'pending evaluations'])) {
            const pendingByTeacher = new Map();
            submissions.filter(s => s.status === 'Pending').forEach((submission) => {
                const assignment = assignments.find(a => String(a._id) === String(submission.assignment));
                if (!assignment?.teacher) return;
                const id = String(assignment.teacher);
                const current = pendingByTeacher.get(id) || { teacherId: id, pending: 0, assignments: new Set() };
                current.pending += 1;
                current.assignments.add(String(assignment._id));
                pendingByTeacher.set(id, current);
            });
            const teacherRows = await User.find({ _id: { $in: [...pendingByTeacher.keys()] } }).lean();
            const choices = teacherRows.map((teacher) => {
                const row = pendingByTeacher.get(String(teacher._id));
                return {
                    id: teacher._id.toString(),
                    title: teacher.name,
                    department: teacher.department,
                    pendingEvaluations: row?.pending || 0,
                    assignmentsWithPending: row?.assignments?.size || 0,
                    entityType: 'TEACHER',
                    path: '/modules/assignments/view.html'
                };
            }).sort((a, b) => b.pendingEvaluations - a.pendingEvaluations);
            lastLookupByUser.set(String(user?._id || ''), { type: 'pendingGrading', choices, at: Date.now() });
            return collection('TEACHER', choices, choices.length ? `Faculty with pending grading: ${choices.length}\nTotal Pending Evaluations: ${pending}` : 'No faculty has pending grading right now.');
        }
        const studentFilter = { role: { $in: ['student', 'hosteler'] } };
        if (deptFilter) studentFilter.department = deptFilter;
        const studentCount = await User.countDocuments(studentFilter);
        const expected = assignments.length * studentCount;
        const stats = { assignments: assignments.length, submissions: submissions.length, pendingEvaluations: pending, expectedSubmissions: expected, completionRate: percentage(submissions.length, expected) };
        return response(`Assignments: ${stats.assignments}\nSubmissions: ${stats.submissions}\nPending Evaluations: ${stats.pendingEvaluations}\nCompletion Rate: ${stats.completionRate}%`, { stats }, 'DEPARTMENT_ASSIGNMENT_ANALYTICS');
    }

    async departmentComplaints(text, user) {
        const filter = {};
        if (user.department) {
            const studentIds = await User.find({ role: { $in: ['student', 'hosteler'] }, department: user.department }).distinct('_id');
            filter.student = { $in: studentIds };
        }
        if (norm(text).includes('unresolved')) filter.status = { $ne: 'Resolved' };
        const complaints = await Complaint.find(filter).populate('student', 'name department').sort({ createdAt: -1 }).limit(20).lean();
        return collection('COMPLAINT', complaints.map(c => ({ id: c._id.toString(), title: c.title, status: c.status, category: c.category, priority: c.priority, studentName: c.student?.name, entityType: 'COMPLAINT', path: `/modules/complaints/view.html?complaintId=${c._id.toString()}` })), complaints.length ? 'Department complaint records are listed below. Assignment or escalation should be finalized in the complaints module.' : 'No department complaints found.');
    }

    async warden(text, user, clientContext) {
        const lower = norm(text);
        if (hasAny(lower, ['create semester result', 'reset database'])) return denied('Warden accounts cannot perform academic result or database administration actions.');
        if (hasAny(lower, ['leave', 'outside hostel', 'approve', 'reject'])) return this.hostelLeaves(text, user);
        if (hasAny(lower, ['complaint', 'electrical', 'sanitation', 'water', 'wifi'])) return this.hostelComplaints(text, user);
        if (hasAny(lower, ['sos', 'emergency'])) return this.sosSupport(text, user, clientContext);
        return this.hostelOccupancy(text, user);
    }

    async hostelOccupancy(text, user) {
        const lower = norm(text);
        const room = lower.match(/room\s*([a-z0-9-]+)/i)?.[1];
        const filter = { role: 'hosteler' };
        if (user.hostelName) filter.hostelName = user.hostelName;
        if (room) filter.roomNumber = new RegExp(`^${escapeRegex(room)}$`, 'i');
        const residents = await User.find(filter).sort({ hostelName: 1, roomNumber: 1, name: 1 }).limit(30).lean();
        const occupiedRooms = new Set(residents.map(r => `${r.hostelName || 'Hostel'}-${r.roomNumber || 'Unassigned'}`));
        return collection('HOSTEL', residents.map(r => ({ id: r._id.toString(), title: r.name, hostelName: r.hostelName, roomNumber: r.roomNumber, rollNumber: r.rollNumber, entityType: 'HOSTELER' })), residents.length ? `Hostel Occupancy: ${residents.length} residents in ${occupiedRooms.size} occupied rooms.` : 'No hostel residents matched that request.');
    }

    async hostelLeaves(text, user) {
        const lower = norm(text);
        const filter = {};
        if (lower.includes('pending')) filter.wardenStatus = 'Pending';
        if (lower.includes('outside')) {
            const now = new Date();
            filter.wardenStatus = 'Approved';
            filter.startDate = { $lte: now };
            filter.endDate = { $gte: now };
        }
        const nameMatch = lower.match(/approve\s+(.+?)'?s?\s+leave|reject\s+(.+?)'?s?\s+leave/);
        const requestedName = (nameMatch?.[1] || nameMatch?.[2] || '').trim();
        let leaves = await Leave.find(filter).populate('student', 'name hostelName roomNumber rollNumber').sort({ createdAt: -1 }).limit(50).lean();
        if (requestedName) leaves = leaves.filter(l => norm(l.student?.name).includes(requestedName));
        if (lower.includes('outside')) leaves = uniqueById(leaves);
        const emptyMessage = lower.includes('outside')
            ? 'No one is currently outside the hostel on an active approved leave.'
            : 'No matching hostel leave records found.';
        return collection('LEAVE', leaves.slice(0, 20).map(l => ({
            id: l._id.toString(),
            title: l.student?.name || 'Student',
            status: l.status,
            wardenStatus: l.wardenStatus,
            startDate: l.startDate,
            endDate: l.endDate,
            roomNumber: l.student?.roomNumber,
            entityType: 'LEAVE',
            path: `/warden/index.html?leaveId=${l._id.toString()}`
        })), leaves.length ? (requestedName ? `Found ${leaves.length} leave request${leaves.length === 1 ? '' : 's'} for ${requestedName}. Open the card to approve or reject in the warden module.` : 'Hostel leave records are listed below. Approve or reject from the leave module.') : emptyMessage);
    }

    async hostelComplaints(text, user) {
        const lower = norm(text);
        const and = [];
        if (lower.includes('hostel')) and.push({ $or: [{ location: /hostel|room/i }, { title: /hostel|room/i }, { description: /hostel|room/i }] });
        if (lower.includes('electrical')) and.push({ $or: [{ category: /electrical/i }, { title: /fan|light|electric|power|wire|shock/i }, { description: /fan|light|electric|power|wire|shock/i }] });
        if (lower.includes('sanitation')) and.push({ $or: [{ category: /sanitation/i }, { title: /washroom|toilet|clean|garbage|sanitation/i }, { description: /washroom|toilet|clean|garbage|sanitation/i }] });
        if (lower.includes('water')) and.push({ $or: [{ category: /civil|sanitation/i }, { title: /water|tap|leak/i }, { description: /water|tap|leak/i }] });
        if (lower.includes('wifi')) and.push({ $or: [{ category: /it/i }, { title: /wifi|wi-fi|internet|network/i }, { description: /wifi|wi-fi|internet|network/i }] });
        const filter = and.length ? { $and: and } : { $or: [{ location: /hostel|room/i }, { title: /hostel|room/i }, { description: /hostel|room/i }] };
        const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).limit(20).lean();
        return collection('COMPLAINT', complaints.map(c => ({ id: c._id.toString(), title: c.title, status: c.status, category: c.category, priority: c.priority, location: c.location, entityType: 'COMPLAINT', path: `/modules/complaints/view.html?complaintId=${c._id.toString()}` })), complaints.length ? `Hostel complaint records matched: ${complaints.length}.` : 'No hostel complaints matched that request.');
    }

    async sosSupport(text, user, clientContext) {
        const lower = norm(text);
        if (hasAny(lower, ['history', 'raised', 'today', 'show'])) {
            const filter = { tool: 'trigger_sos' };
            if (lower.includes('today')) {
                const { start, end } = dayRange(clientContext);
                filter.createdAt = { $gte: start, $lt: end };
            }
            const logs = await AIActionLog.find(filter).populate('userId', 'name role department hostelName roomNumber').sort({ createdAt: -1 }).limit(20).lean();
            return collection('SOS', logs.map(log => ({
                id: log._id.toString(),
                title: log.userId?.name || 'Campus user',
                role: log.userId?.role,
                department: log.userId?.department,
                hostelName: log.userId?.hostelName,
                roomNumber: log.userId?.roomNumber,
                date: log.createdAt,
                entityType: 'SOS'
            })), logs.length ? `SOS history records: ${logs.length}.` : 'No SOS history records matched that request.');
        }
        return {
            version: 'v1',
            success: true,
            presentationState: 'SUCCESS',
            action: 'NAVIGATE',
            semanticType: 'EMERGENCY_GUIDANCE',
            entityType: 'SOS',
            message: 'Opening SOS support. Any logged-in campus user can trigger SOS from the emergency panel; emergency actions bypass normal draft confirmation.',
            payload: { title: 'SOS Support', path: '/index.html?panel=sos', entityType: 'SOS' },
            timestamp: Date.now()
        };
    }

    async mentor(text, user, clientContext) {
        const lower = norm(text);
        const filter = { mentor: user._id, role: { $in: ['student', 'hosteler'] } };
        const nameToken = lower.match(/show\s+([a-z]+)'?s|([a-z]+)'?s\s+(attendance|assignments|academic progress)/)?.[1]
            || lower.match(/show\s+([a-z]+)/)?.[1];
        let students = await User.find(filter).sort({ attendance: 1, cgpa: 1, name: 1 }).limit(50).lean();
        if (!students.length) {
            const fallback = { role: { $in: ['student', 'hosteler'] } };
            if (user.department) fallback.department = user.department;
            students = await User.find(fallback).sort({ attendance: 1, cgpa: 1, name: 1 }).limit(50).lean();
        }
        if (nameToken && !['my', 'students', 'mentees', 'weak'].includes(nameToken)) {
            students = students.filter(s => norm(s.name).includes(nameToken));
        }
        const atRisk = students.filter(s => Number(s.attendance || 0) < 75 || Number(s.cgpa || 0) < 6 || Number(s.backlogs || 0) > 0);
        const source = hasAny(lower, ['risk', 'counselling', 'counseling', 'weak']) ? atRisk : students;
        const choices = source.map(s => ({
            id: s._id.toString(),
            title: s.name,
            rollNumber: s.rollNumber,
            attendance: s.attendance,
            cgpa: s.cgpa,
            backlogs: s.backlogs,
            reason: [
                Number(s.attendance || 0) < 75 ? `Attendance below 75% (${s.attendance || 0}%)` : null,
                Number(s.cgpa || 0) < 6 ? `CGPA below 6.0 (${s.cgpa || 0})` : null,
                Number(s.backlogs || 0) > 0 ? `${s.backlogs} backlog(s)` : null
            ].filter(Boolean).join(', ') || 'No risk flag',
            entityType: 'MENTEE',
            path: `/teacher/mentees.html?studentId=${s._id.toString()}`
        }));
        const summary = `Mentees: ${students.length}\nAt Risk: ${atRisk.length}\nNeed Counselling: ${atRisk.length}\nPending Assignment Concern: ${students.filter(s => Number(s.assignmentsSubmitted || 0) === 0).length}`;
        return collection('MENTEE', choices, choices.length ? `${summary}\n${hasAny(lower, ['report', 'summary', 'meeting']) ? 'Meeting summary prepared from current mentee records.' : 'Mentee records are listed below.'}` : 'No mentees are assigned to your profile.');
    }

    async librarian(text, user, clientContext) {
        const lower = norm(text);
        if (hasAny(lower, ['issue', 'return'])) return response('Book issue and return require final confirmation in the library module. I can find the book or overdue record first.', { redirect: '/librarian/index.html' }, 'LIBRARY_ACTION_GUIDANCE');
        if (hasAny(lower, ['overdue', 'borrowed'])) {
            const transactions = await LibraryTransaction.find({ status: lower.includes('overdue') ? 'Overdue' : { $in: ['Borrowed', 'Overdue'] } }).populate('book', 'title author').populate('user', 'name rollNumber').limit(20).lean();
            return collection('LIBRARY_TRANSACTION', transactions.map(t => ({ id: t._id.toString(), title: t.book?.title || 'Book', borrower: t.user?.name, dueDate: t.dueDate, status: t.status, entityType: 'LIBRARY_TRANSACTION' })), transactions.length ? 'Library transaction records are listed below.' : 'No matching library transactions found.');
        }
        const query = lower.replace(/\b(search|book|books|most borrowed)\b/g, '').trim();
        const filter = query ? { $or: [{ title: new RegExp(escapeRegex(query), 'i') }, { author: new RegExp(escapeRegex(query), 'i') }, { category: new RegExp(escapeRegex(query), 'i') }] } : {};
        const books = await Book.find(filter).sort({ title: 1 }).limit(20).lean();
        return collection('BOOK', books.map(b => ({ id: b._id.toString(), title: b.title, author: b.author, availableCopies: b.availableCopies, location: b.location, entityType: 'BOOK' })), books.length ? `Found ${books.length} book record${books.length === 1 ? '' : 's'}.` : 'No matching books found.');
    }

    async examPlacement(text, user, clientContext) {
        const lower = norm(text);
        if (hasAny(lower, ['eligible students', 'students with backlog', 'infosys'])) {
            const filter = { role: { $in: ['student', 'hosteler'] } };
            if (lower.includes('backlog')) filter.backlogs = { $gt: 0 };
            else filter.backlogs = 0;
            const students = await User.find(filter).sort({ cgpa: -1 }).limit(30).lean();
            return collection('STUDENT', students.map(s => ({ id: s._id.toString(), title: s.name, rollNumber: s.rollNumber, cgpa: s.cgpa, backlogs: s.backlogs, entityType: 'STUDENT' })), students.length ? 'Placement student records are listed below.' : 'No matching placement student records found.');
        }
        if (hasAny(lower, ['publish placement notice', 'exam notice', 'create exam schedule'])) {
            return response('I can prepare the draft, but publishing exam or placement notices must be finalized in the notice module.', { redirect: '/modules/notices/create.html' }, 'NOTICE_DRAFT_GUIDANCE');
        }
        const notices = await this.notices(hasAny(lower, ['placement', 'company']) ? 'placement notices' : 'exam notices', user);
        return response(`${hasAny(lower, ['placement', 'company']) ? 'Placement' : 'Exam'} records are notice-backed in this build.\n${notices.message}`, notices.payload, hasAny(lower, ['placement', 'company']) ? 'PLACEMENT_LOOKUP' : 'EXAM_LOOKUP');
    }

    async multi(text, user, clientContext, intents) {
        const sections = [];
        if (intents.includes('routine')) sections.push(await this.routine(text, user, clientContext));
        if (intents.includes('assignments')) sections.push(await this.assignments(text, user));
        if (intents.includes('notes')) sections.push(await this.notes(text, user));
        if (intents.includes('notices')) sections.push(await this.notices(text, user));
        if (intents.includes('teachers')) sections.push(await this.teachers(text, user));
        if (intents.includes('complaints')) sections.push(await this.complaints(text, user));
        if (intents.includes('attendance')) sections.push(collection('ATTENDANCE', [], 'Open Attendance from the attendance module.', 'ATTENDANCE_VIEW'));

        const choices = sections.flatMap(section => (section.payload?.choices || []).map(choice => ({
            ...choice,
            group: section.entityType
        })));
        return collection('MIXED', choices, choices.length ? `Found results for ${intents.join(', ')}.` : 'I could not find matching records for those requests.', 'MULTI_RESULT');
    }

    async assignments(text, user = {}) {
        const filter = {};
        if (['student', 'hosteler'].includes(user?.role)) {
            if (user.department) filter.department = user.department;
            if (user.year) filter.year = user.year;
            if (user.batch) filter.batch = { $in: [...batchValues(user.batch), 'All', 'all'] };
        } else if (['teacher', 'hod'].includes(user?.role)) {
            filter.teacher = user._id;
        }
        const lower = norm(text);
        const subject = resolveSubject(text);
        if (subject) filter.subject = subjectRegex(subject);
        if (lower.includes('overdue')) filter.deadline = { $lt: new Date() };
        if (lower.includes('pending')) filter.deadline = { $gte: new Date() };
        if (lower.includes('due tomorrow')) {
            const start = new Date();
            start.setDate(start.getDate() + 1);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            filter.deadline = { $gte: start, $lt: end };
        }

        const assignments = await Assignment.find(filter).populate('teacher', 'name').sort({ deadline: 1 }).limit(10).lean();
        const choices = assignments.map(item => ({
            id: item._id.toString(),
            title: item.title,
            subject: item.subject,
            deadline: item.deadline,
            facultyName: item.teacher?.name || 'Faculty',
            entityType: 'ASSIGNMENT',
            path: `/modules/assignments/view.html?assignmentId=${item._id.toString()}`
        }));
        return collection('ASSIGNMENT', choices, choices.length ? `Found ${choices.length} assignment${choices.length === 1 ? '' : 's'}.` : 'I could not find assignments for your profile.');
    }

    async notices(text, user = {}) {
        const lower = norm(text);
        const filter = {};
        if (lower.includes('holiday')) filter.$or = [{ title: /holiday|closed|vacation/i }, { content: /holiday|closed|vacation/i }];
        else if (lower.includes('exam')) filter.$or = [{ title: /exam/i }, { content: /exam/i }];
        else if (lower.includes('placement')) filter.$or = [{ title: /placement/i }, { content: /placement/i }];
        const notices = (await Notice.find(filter).sort({ createdAt: -1 }).limit(30).lean())
            .filter(item => targetMatchesUser(item, user))
            .slice(0, 10);
        const choices = notices.map(item => ({
            id: item._id.toString(),
            title: item.title,
            subject: item.content,
            date: item.createdAt,
            entityType: 'NOTICE',
            audience: item.audience || 'general',
            path: `/modules/notices/view.html?noticeId=${item._id.toString()}`
        }));
        return collection('NOTICE', choices, choices.length ? `Found ${choices.length} notice${choices.length === 1 ? '' : 's'}.` : 'I could not find matching notices.');
    }

    async notes(text, user = {}) {
        const lower = norm(text);
        const filter = {};
        const subject = resolveSubject(text);
        if (subject) {
            const regex = subjectRegex(subject);
            filter.$or = [{ topic: regex }, { subject: regex }, { description: regex }];
        }
        if (user?.department) filter.department = user.department;
        if (user?.year) filter.year = user.year;
        if (user?.batch) filter.batch = { $in: [...batchValues(user.batch), 'All', 'all', '', null] };
        const notes = await Note.find(filter).sort({ createdAt: -1 }).limit(10).lean();
        const choices = notes.map(item => ({
            id: item._id.toString(),
            title: item.topic || item.subject,
            subject: item.subject || item.description,
            fileUrl: item.fileUrl,
            entityType: 'NOTE',
            path: item.fileUrl || `/modules/assignments/view.html?noteId=${item._id.toString()}`
        }));
        return collection('NOTE', choices, choices.length ? `Found ${choices.length} note${choices.length === 1 ? '' : 's'}.` : 'I could not find matching notes.');
    }

    async routine(text, user = {}, clientContext = {}) {
        const filter = {};
        const day = resolveDay(text, clientContext);
        if (day) filter.day = day;
        if (user?.department) filter.department = user.department;
        if (['student', 'hosteler'].includes(user?.role)) {
            if (user.year) filter.year = user.year;
            if (user.batch) filter.batch = { $in: batchValues(user.batch) };
        }
        const subject = resolveSubject(text);
        if (subject) filter.$or = [{ subjectName: subjectRegex(subject) }];
        const routines = await Routine.find(filter).populate('teacher', 'name').populate('subject', 'name code').limit(10).lean();
        const choices = routines.map(item => ({
            id: item._id.toString(),
            title: `${item.day || ''} ${item.timeSlot || ''}`.trim(),
            subject: item.subject?.name || item.subjectName || 'Class',
            facultyName: item.teacher?.name || 'Faculty not assigned',
            room: item.room,
            entityType: 'SCHEDULE',
            path: '/modules/routine/view.html'
        }));
        return collection('SCHEDULE', choices, choices.length ? `Here is your ${day || 'matching'} routine.` : 'I could not find a routine for that request.', 'SCHEDULE_VIEW');
    }

    async teachers(text, user = {}) {
        const lower = norm(text);
        const filter = { role: { $in: ['teacher', 'hod'] } };
        const subject = resolveSubject(text);
        if (user?.department && !lower.includes('all')) filter.department = user.department;
        if (subject) {
            const regex = subjectRegex(subject);
            filter.$or = [{ teachingSubjects: regex }, { subjects: regex }];
        } else if (hasAny(lower, ['my teacher', 'my teachers']) && ['student', 'hosteler'].includes(user?.role)) {
            const routineFilter = {};
            if (user.department) routineFilter.department = user.department;
            if (user.year) routineFilter.year = user.year;
            if (user.batch) routineFilter.batch = { $in: batchValues(user.batch) };
            const teacherIds = await Routine.find(routineFilter).distinct('teacher');
            filter._id = { $in: teacherIds };
        }
        const teachers = await User.find(filter).limit(10).lean();
        const choices = teachers.map(item => ({
            id: item._id.toString(),
            title: item.name,
            subject: item.designation || item.role,
            facultyName: item.department,
            meta: (item.teachingSubjects || item.subjects || []).join(', '),
            entityType: 'TEACHER',
            path: item.role === 'hod' ? '/hod/index.html' : '/teacher/index.html'
        }));
        return collection('TEACHER', choices, choices.length ? `Found ${choices.length} teacher${choices.length === 1 ? '' : 's'}.` : 'I could not find matching teachers.');
    }

    async peopleInfo(text, user = {}) {
        const lower = norm(text);
        if (lower.includes('mentor')) {
            const current = await User.findById(user._id).populate('mentor', 'name email designation department').lean();
            const mentor = current?.mentor;
            const choices = mentor ? [{
                id: mentor._id.toString(),
                title: mentor.name,
                subject: mentor.designation || 'Mentor',
                facultyName: mentor.department,
                meta: mentor.email,
                entityType: 'TEACHER',
                path: '/teacher/index.html'
            }] : [];
            return collection('TEACHER', choices, choices.length ? `Your mentor is ${mentor.name}.` : 'I could not find an assigned mentor in your profile.');
        }

        const filter = { role: 'hod' };
        if (user.department) filter.department = user.department;
        const hods = await User.find(filter).limit(3).lean();
        const choices = hods.map(item => ({
            id: item._id.toString(),
            title: item.name,
            subject: item.designation || 'Head of Department',
            facultyName: item.department,
            meta: item.email,
            entityType: 'TEACHER',
            path: '/hod/index.html'
        }));
        return collection('TEACHER', choices, choices.length ? `Your HOD is ${choices[0].title}.` : 'I could not find the HOD for your department.');
    }

    async complaints(text, user = {}) {
        const filter = {};
        if (user?._id) filter.student = user._id;
        if (norm(text).includes('unresolved')) filter.status = { $ne: 'Resolved' };
        const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).limit(10).lean();
        const choices = complaints.map(item => ({
            id: item._id.toString(),
            title: item.title,
            subject: item.status,
            category: item.category,
            priority: item.priority,
            entityType: 'COMPLAINT',
            path: `/modules/complaints/view.html?complaintId=${item._id.toString()}`
        }));
        return collection('COMPLAINT', choices, choices.length ? `Found ${choices.length} complaint${choices.length === 1 ? '' : 's'}.` : 'I could not find complaints for your profile.');
    }
}

export default new LookupRuntime();
