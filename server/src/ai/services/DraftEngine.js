const cleanText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const titleCase = (value) => cleanText(value)
    .replace(/\b\w+\b/g, word => {
        if (/^(IT|LAN|WiFi)$/i.test(word)) return word.toUpperCase() === 'WIFI' ? 'WiFi' : word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

const mergeLocation = (fields) => {
    if (fields.location && fields.room && !new RegExp(`\\b${fields.room}\\b`, 'i').test(fields.location)) {
        return `${fields.location} Room ${fields.room}`;
    }
    if (fields.location) return fields.location;
    return [fields.building, fields.room ? `Room ${fields.room}` : ''].filter(Boolean).join(' ') || undefined;
};

const getFacts = (fields) => {
    const facts = [];
    if (fields.incidentDate) facts.push(`date: ${fields.incidentDate}`);
    if (fields.incidentTime) facts.push(`time: ${fields.incidentTime}`);
    if (fields.location) facts.push(`location: ${fields.location}`);
    if (fields.building) facts.push(`building: ${fields.building}`);
    if (fields.room) facts.push(`room: ${fields.room}`);
    if (fields.equipment) facts.push(`equipment: ${fields.equipment}`);
    if (fields.networkType) facts.push(`network: ${fields.networkType}`);
    if (fields.startedAt) facts.push(`started: ${fields.startedAt}`);
    if (fields.duration) facts.push(`duration: ${fields.duration}`);
    if (fields.currentCondition) facts.push(`condition: ${fields.currentCondition}`);
    if (fields.meal) facts.push(`meal: ${fields.meal}`);
    if (fields.foodItem) facts.push(`food item: ${fields.foodItem}`);
    if (fields.personsInvolved) facts.push(`persons involved: ${fields.personsInvolved}`);
    if (fields.witnesses) facts.push(`witnesses: ${fields.witnesses}`);
    return facts;
};

const complaintTitle = (fields) => {
    const location = mergeLocation(fields);
    if (fields.subcategory === 'Ragging') return location ? `Alleged Ragging Incident Near ${location}` : 'Alleged Ragging Incident';
    if (fields.subcategory === 'WiFi Connectivity Issue') return location ? `WiFi Connectivity Issue - ${location}` : 'WiFi Connectivity Issue';
    if (fields.category === 'Electrical' && fields.equipment) return `${titleCase(fields.equipment)} Issue${location ? ` - ${location}` : ''}`;
    if (fields.category === 'Sanitation') return location ? `Sanitation Issue at ${location}` : 'Sanitation Issue';
    if (fields.category === 'Mess') return fields.foodItem ? `Mess Food Quality Issue - ${titleCase(fields.foodItem)}` : 'Mess Food Quality Issue';
    if (fields.category === 'Civil') return location ? `${fields.subcategory} at ${location}` : fields.subcategory;
    return fields.subcategory || fields.title || 'Campus Complaint';
};

const observedImpact = (fields) => {
    if (fields.subcategory === 'Ragging') return ['Emotional distress', 'Student safety concern', 'Possible violation of anti-ragging policy'];
    if (fields.category === 'IT') return ['Interrupted internet access', 'Academic or hostel connectivity disruption'];
    if (fields.category === 'Electrical') return fields.priority === 'Critical'
        ? ['Electrical safety risk', 'Possible injury or fire hazard']
        : ['Reduced room usability', 'Student inconvenience'];
    if (fields.category === 'Sanitation') return ['Hygiene concern', 'Unhealthy common-area condition'];
    if (fields.category === 'Mess') return ['Food quality concern', 'Student health and satisfaction issue'];
    if (fields.category === 'Civil') return ['Infrastructure damage', 'Potential safety or maintenance concern'];
    return ['Campus service concern'];
};

const requestedAction = (fields) => {
    if (fields.subcategory === 'Ragging') {
        return ['Conduct an investigation.', 'Identify the accused students.', 'Ensure student safety.', 'Take disciplinary action if allegations are confirmed.'];
    }
    if (fields.category === 'IT') return ['Inspect the affected network connection.', 'Restore stable connectivity.', 'Update the complainant after resolution.'];
    if (fields.category === 'Electrical') return ['Inspect the affected equipment.', 'Repair or replace faulty components.', 'Ensure the area is safe before closing the complaint.'];
    if (fields.category === 'Sanitation') return ['Clean and sanitize the affected area.', 'Inspect whether recurring maintenance is required.', 'Confirm the area is usable.'];
    if (fields.category === 'Mess') return ['Review the reported food item or meal.', 'Inspect food quality and hygiene.', 'Take corrective action with the mess staff if needed.'];
    if (fields.category === 'Civil') return ['Inspect the affected area.', 'Repair the infrastructure issue.', 'Prevent further damage or risk.'];
    return ['Review the complaint.', 'Assign it to the appropriate authority.', 'Take corrective action if required.'];
};

const complaintDescription = (fields) => {
    const location = mergeLocation(fields);
    const dateText = fields.incidentDate ? ` on ${fields.incidentDate}` : '';
    const timeText = fields.incidentTime ? ` at approximately ${fields.incidentTime}` : '';
    const locationText = location ? ` near ${location}` : '';

    if (fields.subcategory === 'Ragging') {
        const lines = [
            `The complainant stated that${dateText}${timeText}${locationText}, they were allegedly subjected to ragging${fields.personsInvolved ? ` by ${fields.personsInvolved}` : ' by other students'}.`
        ];
        if (fields.issue) lines.push(`During the incident, ${fields.issue}.`);
        if (fields.witnesses) lines.push(`The complainant also stated that ${fields.witnesses} witnessed the incident.`);
        lines.push('Considering the seriousness of the allegations, the matter requires immediate investigation by the competent disciplinary authority.');
        return lines.join('\n\n');
    }

    const facts = getFacts({ ...fields, location });
    return [
        `The complainant has reported a ${String(fields.subcategory || fields.category || 'campus issue').toLowerCase()}${location ? ` affecting ${location}` : ''}.${facts.length ? ` The available details are ${facts.join('; ')}.` : ''}`,
        fields.issue ? `The reported issue is: ${cleanText(fields.issue)}.` : '',
        `The matter should be reviewed by the ${fields.department || 'appropriate department'} and resolved based on the verified condition at the site.`
    ].filter(Boolean).join('\n\n');
};

const builders = {
    complaint(fields) {
        const location = mergeLocation(fields);
        const draft = {
            ...fields,
            location,
            title: fields.title || complaintTitle({ ...fields, location }),
            summary: fields.summary || (fields.subcategory === 'Ragging'
                ? `A student reported an alleged ragging incident involving ${fields.personsInvolved || 'other students'}${location ? ` near ${location}` : ''}.`
                : `A ${String(fields.subcategory || fields.category).toLowerCase()} has been reported${location ? ` at ${location}` : ''}.`),
            description: fields.description || complaintDescription({ ...fields, location }),
            observedImpact: fields.observedImpact || observedImpact(fields),
            requestedAction: fields.requestedAction || requestedAction(fields),
            suggestedDepartment: fields.suggestedDepartment || fields.department
        };
        return draft;
    },

    notice(fields) {
        return {
            ...fields,
            title: fields.title || 'Campus Notice',
            content: cleanText(fields.content || fields.description || ''),
            audience: fields.audience || 'general'
        };
    },

    assignment(fields) {
        return {
            ...fields,
            title: fields.title || fields.assignmentTitle || 'Assignment Draft',
            content: cleanText(fields.content || fields.instructions || ''),
            instructions: cleanText(fields.instructions || fields.content || '')
        };
    },

    leave(fields) {
        return {
            ...fields,
            reason: cleanText(fields.reason || ''),
            type: fields.type || fields.leaveType || 'Home Visit'
        };
    }
};

class DraftEngine {
    build(entity, fields) {
        const builder = builders[entity] || ((values) => ({ ...values }));
        return builder(fields || {});
    }

    toRedirectDto({ entity, redirect, draft }) {
        return {
            entity,
            mode: 'draft',
            status: 'draft',
            action: 'REDIRECT',
            redirect,
            draft
        };
    }
}

export default new DraftEngine();
