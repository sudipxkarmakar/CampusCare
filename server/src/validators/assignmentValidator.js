export const validate = (args, user) => {
    // Basic structural validation
    if (!args.subject || !args.batch || !args.deadline) {
        return {
            success: false,
            type: "VALIDATION_ERROR",
            field: "general",
            message: "Missing required fields: subject, batch, or deadline."
        };
    }

    // Example of domain validation:
    // Check if the teacher actually teaches this subject
    const teacherSubjects = user.teachingSubjects || [];
    // If we have teaching subjects defined and it doesn't match, block it.
    // (In a real app, you might also do DB lookups for Subject mapping)
    if (teacherSubjects.length > 0 && !teacherSubjects.includes(args.subject)) {
        return {
            success: false,
            type: "VALIDATION_ERROR",
            field: "subject",
            message: `Teacher is not authorized to create assignments for ${args.subject}.`
        };
    }

    return { success: true };
};
