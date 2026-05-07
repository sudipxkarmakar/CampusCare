import Leave from '../../models/Leave.js';

export const execute = async (args, user, conversationId, traceId, options = {}) => {
    const { signal, execId } = options;
    if (!user || user.role !== 'student') {
        throw new Error("UNAUTHORIZED: Only students can apply for leave.");
    }

    const leaveType = ['Night Out', 'Home Visit', 'Medical'].includes(args.leaveType) ? args.leaveType : 'Home Visit';
    
    if (signal?.aborted) {
        const e = new Error("EXECUTION_TIMEOUT");
        e.name = "AbortError";
        throw e;
    }

    // Create the DB record
    const newLeave = await Leave.create({
        student: user._id,
        type: leaveType,
        startDate: new Date(args.startDate || Date.now()),
        endDate: new Date(args.endDate || Date.now()),
        reason: args.reason || "Personal",
        status: 'Pending HOD Approval',
        executionId: execId
    });

    return {
        success: true,
        type: "SUCCESS",
        action: "OPEN_LEAVE_MODAL",
        message: "I have successfully submitted your leave application to the HOD workflow. You can track its status in the Leaves section.",
        payload: { leaveId: newLeave._id }
    };
};
