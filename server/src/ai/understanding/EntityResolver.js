import User from '../../models/User.js';
import Subject from '../../models/Subject.js';

export const resolveEntities = async (entities) => {
    const resolved = { ...entities };

    // Resolve Faculty / User
    if (entities.facultyName) {
        const userObj = await User.findOne({
            role: 'teacher',
            name: new RegExp(entities.facultyName, 'i')
        }).lean();
        if (userObj) {
            resolved.teacherId = userObj._id.toString();
            resolved.facultyResolvedName = userObj.name;
        }
    }

    // Resolve Subject
    if (entities.subject) {
        const subObj = await Subject.findOne({
            name: new RegExp(entities.subject, 'i')
        }).lean();
        if (subObj) {
            resolved.subjectId = subObj._id.toString();
            resolved.subjectResolvedName = subObj.name;
        }
    }

    return resolved;
};
