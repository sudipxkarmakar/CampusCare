import User from '../../../models/User.js';
import Complaint from '../../../models/Complaint.js';
import Notice from '../../../models/Notice.js';
import Assignment from '../../../models/Assignment.js';

export default class MongoProvider {
    async search(query, context) {
        const results = [];
        const pattern = new RegExp(query, 'i');

        // Notices
        const notices = await Notice.find({
            $or: [{ title: pattern }, { content: pattern }]
        }).limit(5).lean();
        notices.forEach(n => results.push({
            id: n._id.toString(),
            title: n.title,
            subject: n.content,
            entityType: 'NOTICE'
        }));

        // Complaints
        const complaints = await Complaint.find({
            $or: [{ title: pattern }, { description: pattern }]
        }).limit(5).lean();
        complaints.forEach(c => results.push({
            id: c._id.toString(),
            title: c.title,
            subject: c.status,
            entityType: 'COMPLAINT'
        }));

        // Assignments
        const assignments = await Assignment.find({
            $or: [{ title: pattern }, { subject: pattern }]
        }).limit(5).lean();
        assignments.forEach(a => results.push({
            id: a._id.toString(),
            title: a.title,
            subject: a.subject,
            entityType: 'ASSIGNMENT'
        }));

        return results;
    }
}
