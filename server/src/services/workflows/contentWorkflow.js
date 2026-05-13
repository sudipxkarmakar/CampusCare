import Assignment from '../../models/Assignment.js';
import Note from '../../models/Note.js';
import Notice from '../../models/Notice.js';
import Submission from '../../models/Submission.js';
import Routine from '../../models/Routine.js';

const authorize = (user) => {
    if (!user || !user.department) throw new Error("UNAUTHORIZED: User profile incomplete.");
};

export const executeAssignments = async (args, user, conversationId, traceId) => {
    authorize(user);
    const { department, year, batch } = user;

    const assignmentsData = await Assignment.find({
        department,
        year,
        $or: [{ batch: batch }, { batch: 'All' }]
    }).populate('teacher', 'name');

    const submissions = await Submission.find({ student: user._id });
    const submissionMap = new Set(submissions.map(s => s.assignment.toString()));

    const assignments = assignmentsData.filter(a => !submissionMap.has(a._id.toString())).map(a => ({
        id: a._id.toString(),
        title: a.title,
        subject: a.subject,
        deadline: a.deadline,
        facultyName: a.teacher?.name || "Unknown Faculty",
        assignmentType: "Homework"
    }));

    return {
        success: true,
        semanticType: "ACTION_SELECTION",
        entityType: "ASSIGNMENT",
        message: args.prompt || "I've found your pending academic obligations:",
        payload: { choices: assignments }
    };
};

export const executeNotes = async (args, user, conversationId, traceId) => {
    authorize(user);
    const { department, year, batch, subBatch } = user;

    const notesData = await Note.find({
        department,
        year,
        $or: [
            { batch: batch, subBatch: { $exists: false } },
            { batch: batch, subBatch: null },
            { batch: batch, subBatch: subBatch }
        ]
    }).populate('uploadedBy', 'name');

    const notes = notesData.map(n => ({
        id: n._id.toString(),
        title: n.topic,
        subject: n.subject,
        facultyName: n.uploadedBy?.name || "Unknown Faculty",
        fileUrl: n.fileUrl
    }));

    return {
        success: true,
        semanticType: "COLLECTION_VIEW",
        entityType: "NOTE",
        message: args.prompt || "Here are your learning resources:",
        payload: { choices: notes }
    };
};

export const executeSelectResource = async (args, user, conversationId, traceId) => {
    if (!args.fileUrl) throw new Error("No file URL provided for resource selection.");

    return {
        success: true,
        semanticType: "RESOURCE_DETAIL",
        action: "OPEN_NOTE",
        message: `Opening resource: ${args.title || 'Selected Learning Material'}`,
        payload: { fileUrl: args.fileUrl }
    };
};

export const executeRoutine = async (args, user, conversationId, traceId) => {
    authorize(user);
    const { department, year, batch } = user;

    const routine = await Routine.findOne({ department, year, batch });

    return {
        success: true,
        semanticType: "SCHEDULE_VIEW",
        message: "Here is your class schedule:",
        payload: routine
    };
};

export const executeNotices = async (args, user, conversationId, traceId) => {
    const noticesData = await Notice.find({
        $or: [{ role: 'public' }, { role: user?.role }]
    }).sort({ createdAt: -1 }).limit(5);

    const notices = noticesData.map(n => ({
        id: n._id.toString(),
        title: n.title,
        content: n.content,
        date: n.createdAt
    }));

    return {
        success: true,
        semanticType: "COLLECTION_VIEW",
        entityType: "NOTICE",
        message: "Here are the latest institutional announcements:",
        payload: { choices: notices }
    };
};
