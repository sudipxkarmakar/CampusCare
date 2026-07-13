import AIKernel from '../kernel/AIKernel.js';

const includesAny = (text, phrases) => phrases.some(phrase => text.includes(phrase));

export const classifyIntent = (parsed) => {
    const text = parsed.normalized;
    let resolved = 'GENERAL';
    let maxMatches = 0;

    // Direct capabilities check via kernel registry commands/synonyms
    for (const command of AIKernel.commands) {
        let matches = 0;
        command.synonyms.forEach(syn => {
            if (text.includes(syn.toLowerCase())) matches++;
        });

        if (matches > maxMatches) {
            maxMatches = matches;
            resolved = command.capabilityId;
        }
    }

    const lookupSignals = ['status', 'track', 'progress', 'how many', 'list', 'show', 'view', 'open', 'pending', 'overdue', 'unread', 'latest', 'today', 'tomorrow', 'due', 'deadline', 'do i have', 'who', 'which', 'what', 'department performs', 'most complaints', 'who teaches', 'who is taking'];
    const lookupDomains = ['assignment', 'assignments', 'complaint', 'complaints', 'submission', 'submissions', 'notice', 'notices', 'notes', 'routine', 'schedule', 'timetable', 'teacher', 'teachers', 'faculty', 'attendance', 'holiday', 'holidays', 'department', 'departments', 'analytics', 'performance'];
    const asksForExisting = includesAny(text, lookupSignals);
    if (asksForExisting && includesAny(text, lookupDomains)) {
        return {
            intent: 'searchEverywhere',
            confidence: 0.9
        };
    }

    // Heuristics mappings fallback
    if (resolved === 'GENERAL') {
        const complaintSignal = (
            text.includes('complaint') ||
            text.includes('complain') ||
            text.includes('issue') ||
            text.includes('problem') ||
            text.includes('broken') ||
            text.includes('not working') ||
            text.includes('ragging') ||
            text.includes('ragged') ||
            text.includes('harassment') ||
            text.includes('harassing') ||
            text.includes('bullying') ||
            text.includes('insulting') ||
            text.includes('threat') ||
            text.includes('smelled bad') ||
            text.includes('smells bad') ||
            text.includes('bad smell') ||
            text.includes('became sick') ||
            text.includes('fell sick') ||
            text.includes('food poisoning') ||
            text.includes('fan not working') ||
            text.includes("fan isn't working") ||
            text.includes('wifi not working') ||
            text.includes('food is bad') ||
            text.includes('washroom is dirty')
        );

        if (asksForExisting && includesAny(text, lookupDomains)) resolved = 'searchEverywhere';
        else if (complaintSignal) resolved = 'raiseComplaint';
        else if (
            includesAny(text, ['publish notice', 'post notice', 'create notice', 'announce']) ||
            ((text.includes('create') || text.includes('publish') || text.includes('post')) && text.includes('notice'))
        ) resolved = 'publishNotice';
        else if (text.includes('notice') || text.includes('announcement') || text.includes('circular')) resolved = 'searchEverywhere';
        else if ((text.includes('submit') || text.includes('turn in') || text.includes('upload') || text.includes('complete')) && (text.includes('assignment') || text.includes('homework'))) resolved = 'submitAssignment';
        else if (text.includes('routine') || text.includes('schedule') || text.includes('timetable')) resolved = 'viewRoutine';
        else if (text.includes('notes') || text.includes('material')) resolved = 'viewNotes';
        else if (text.includes('leave') || text.includes('night out')) resolved = 'submitLeave';
        else if (text.includes('search') || text.includes('find') || text.includes('defaulters')) resolved = 'searchEverywhere';
    }

    return {
        intent: resolved,
        confidence: maxMatches > 0 ? 0.95 : 0.8
    };
};
