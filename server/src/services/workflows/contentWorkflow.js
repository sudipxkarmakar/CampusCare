import Assignment from '../../models/Assignment.js';
import Note from '../../models/Note.js';
import Notice from '../../models/Notice.js';
import Submission from '../../models/Submission.js';

export const execute = async (args, user, conversationId, traceId, options = {}) => {
    // 1. Authorize (Implicit in WorkflowService, but let's be sure)
    if (!user || !user.department) {
        throw new Error("UNAUTHORIZED: User profile incomplete.");
    }

    const { department, year, batch, subBatch } = user;

    // 2. Fetch Assignments
    const assignmentsData = await Assignment.find({
        department,
        year,
        $or: [{ batch: batch }, { batch: 'All' }]
    }).populate('teacher', 'name');

    const submissions = await Submission.find({ student: user._id });
    const submissionMap = new Set(submissions.map(s => s.assignment.toString()));

    const assignments = assignmentsData.map(a => ({
        id: a._id,
        title: a.title,
        subject: a.subject,
        deadline: a.deadline,
        submitted: submissionMap.has(a._id.toString()),
        teacher: a.teacher?.name
    }));

    // 3. Fetch Notes
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
        topic: n.topic,
        subject: n.subject,
        teacher: n.uploadedBy?.name
    }));

    let message = "I've checked your dashboard. ";
    if (assignments.filter(a => !a.submitted).length > 0) {
        message += `You have ${assignments.filter(a => !a.submitted).length} pending assignments (including ${assignments[0].subject}). `;
    } else {
        message += "You have no pending assignments! ";
    }
    
    if (notes.length > 0) {
        message += `I also found ${notes.length} new study materials for you. `;
    }

    return {
        success: true,
        type: "SUCCESS",
        action: "AI_RESPONSE",
        message: message,
        payload: {
            assignments: assignments.filter(a => !a.submitted),
            notes: notes
        }
    };
};
