export class AiService {

    constructor() {
        this.categories = {
            ragging: ['ragging', 'bullying', 'harassment', 'teasing', 'abuse'],
            academic: ['class', 'exam', 'grade', 'teacher', 'assignment', 'lecture', 'syllabus'],
            infrastructure: ['fan', 'light', 'water', 'internet', 'wifi', 'broken', 'repair', 'clean', 'washroom'],
            hostel: ['mess', 'food', 'room', 'bed', 'warden', 'hostel'],
            emergency: ['medical', 'blood', 'accident', 'fight', 'fire', 'sos', 'emergency', 'help']
        };

        this.priorityKeywords = {
            critical: ['blood', 'accident', 'suicide', 'fire', 'attack', 'emergency', 'dying', 'danger', 'sos'],
            high: ['ragging', 'harassment', 'urgent', 'immediately', 'severe'],
            medium: ['broken', 'not working', 'issue', 'problem'],
            low: ['request', 'suggestion', 'inquiry']
        };
    }

    processInput(text) {
        const intent = this.classifyIntent(text);
        let result = {
            originalText: text,
            intent: intent,
            timestamp: new Date().toISOString()
        };

        if (intent === 'COMPLAINT') {
            result.analysis = this.analyzeComplaint(text);
            result.response = this.generateComplaintResponse(result.analysis);
        } else if (intent === 'PRODUCTIVITY') {
            result.analysis = this.analyzeProductivity(text);
            result.response = this.generateProductivityResponse(result.analysis);
        } else {
            result.response = "I can help you file complaints or draft applications. Please provide more details.";
        }

        return result;
    }

    classifyIntent(text) {
        const lowerText = text.toLowerCase();

        // Productivity keywords
        if (lowerText.includes('leave') || lowerText.includes('application') || lowerText.includes('letter') || lowerText.includes('draft') || lowerText.includes('resume')) {
            return 'PRODUCTIVITY';
        }

        // Complaint keywords (broad matching for defaults)
        const complaintKeywords = ['broken', 'not working', 'issue', 'bad', 'ragging', 'fight', 'help', 'complain', 'report', 'against'];
        if (complaintKeywords.some(k => lowerText.includes(k))) {
            return 'COMPLAINT';
        }

        return 'QUERY';
    }

    analyzeComplaint(text) {
        const lowerText = text.toLowerCase();
        const categories = [];
        let priority = 'Low';

        // 1. Determine Category
        for (const [cat, keywords] of Object.entries(this.categories)) {
            if (keywords.some(k => lowerText.includes(k))) {
                categories.push(cat);
            }
        }
        const finalCategory = categories.length > 0 ? categories[0] : 'General'; // Default to first match or General

        // 2. Determine Priority
        if (this.priorityKeywords.critical.some(k => lowerText.includes(k))) priority = 'Critical';
        else if (this.priorityKeywords.high.some(k => lowerText.includes(k))) priority = 'High';
        else if (this.priorityKeywords.medium.some(k => lowerText.includes(k))) priority = 'Medium';

        // 3. Extract Entities (Simple Regex)
        const roomMatch = text.match(/room\s+(\d+|[a-z]-\d+)/i);
        const location = roomMatch ? `Room ${roomMatch[1]}` : 'Unspecified Location';

        return {
            category: finalCategory,
            priority: priority,
            location: location,
            summary: text,
            autoRouting: this.getRouting(finalCategory, priority)
        };
    }

    analyzeProductivity(text) {
        const lowerText = text.toLowerCase();
        let type = 'General Request';

        if (lowerText.includes('leave')) type = 'Leave Application';
        else if (lowerText.includes('notice')) type = 'Notice Draft';

        return { type };
    }

    generateComplaintResponse(analysis) {
        if (analysis.priority === 'Critical') {
            return {
                message: "SOS PROTOCOL ACTIVATED. Authorities have been alerted immediately.",
                action: "SOS_TRIGGERED",
                details: analysis
            };
        }

        return {
            message: `Complaint Drafted. \nCategory: ${analysis.category.toUpperCase()}\nPriority: ${analysis.priority}\nAssigned To: ${analysis.autoRouting}`,
            draft: `FORMAL COMPLAINT\n\nTo: ${analysis.autoRouting}\nSubject: Complaint regarding ${analysis.category} issue\n\nRespected Sir/Madam,\n\nI am writing to report an issue: ${analysis.summary}.\nLocation: ${analysis.location}\n\nRequesting immediate action.\n\nSincerely,\nStudent`,
            action: "DRAFT_CREATED",
            details: analysis
        };
    }

    generateProductivityResponse(analysis) {
        if (analysis.type === 'Leave Application') {
            return {
                message: "Here is your Leave Application draft.",
                draft: `APPLICATION FOR LEAVE\n\nTo,\nThe Head of Department,\n[Department Name]\n\nRespected Sir/Madam,\n\nSubject: Application for Leave\n\nI am writing to request leave from [Start Date] to [End Date] due to [Reason].\n\nEnsure strict compliance with my academic responsibilities upon return.\n\nThank you.\n\nYours details,\n[Name]\n[Roll No]`,
                action: "DRAFT_CREATED"
            };
        }
        return {
            message: "I can help draft that. Could you recognize the type?",
            draft: "Generic Draft content..."
        };
    }

    getRouting(category, priority) {
        if (priority === 'Critical') return 'PRINCIPAL & SECURITY';
        if (category === 'ragging') return 'ANTI-RAGGING COMMITTEE';
        if (category === 'infrastructure') return 'MAINTENANCE DEPT';
        if (category === 'academic') return 'ACADEMIC CELL';
        if (category === 'hostel') return 'HOSTEL WARDEN';
        return 'ADMIN OFFICE';
    }
}

export default new AiService();
