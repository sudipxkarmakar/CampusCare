const KNOWN_LOCATIONS = [
    'Hostel A',
    'Hostel B',
    'Hostel C',
    'Computer Lab',
    'Library',
    'IT Lab',
    'Chemistry Lab',
    'Physics Lab',
    'Auditorium',
    'Canteen',
    'Mess',
    'Second Floor Boys Washroom',
    'Second Floor Girls Washroom',
    'Boys Washroom',
    'Girls Washroom'
];

const cleanText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const titleCase = (value) => cleanText(value)
    .replace(/\b\w+\b/g, word => {
        if (/^(IT|LAN|WiFi)$/i.test(word)) return word.toUpperCase() === 'WIFI' ? 'WiFi' : word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .replace(/\bBoys Washroom\b/g, "Boys' Washroom")
    .replace(/\bGirls Washroom\b/g, "Girls' Washroom");

const extractDate = (text) => {
    const lower = String(text || '').toLowerCase();
    if (lower.includes('yesterday')) {
        const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return date.toISOString().slice(0, 10);
    }
    if (lower.includes('today')) return new Date().toISOString().slice(0, 10);
    const iso = lower.match(/\b\d{4}-\d{2}-\d{2}\b/);
    return iso ? iso[0] : null;
};

const extractTime = (text) => {
    const time = String(text || '').match(/\b(?:around|at|approximately)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (!time) return null;
    return `${time[1]}${time[2] ? `:${time[2]}` : ''} ${time[3].toUpperCase()}`;
};

class EntityResolver {
    resolve(text) {
        const original = String(text || '');
        const lower = original.toLowerCase();
        const resolved = {};

        const known = KNOWN_LOCATIONS.find(location => new RegExp(`\\b${location.replace(/\s+/g, '\\s+')}\\b`, 'i').test(original));
        if (known) resolved.location = titleCase(known);

        const hostel = original.match(/\bhostel\s+[a-z]\b/i);
        if (hostel) resolved.building = titleCase(hostel[0]);

        const lab = original.match(/\b(?:computer|it|chemistry|physics)\s+lab\b/i);
        if (lab) resolved.building = titleCase(lab[0]);
        if (/\blibrary\b/i.test(original)) resolved.building = 'Library';

        const hostelRoom = original.match(/\b(hostel\s+[a-z])\s+(?:room\s*)?([a-z]?\d{2,4})\b/i);
        if (hostelRoom) {
            resolved.building = titleCase(hostelRoom[1]);
            resolved.room = hostelRoom[2].toUpperCase();
            resolved.location = `${resolved.building} Room ${resolved.room}`;
        } else {
            const room = original.match(/\broom\s*[-#]?\s*([a-z]?\d{2,4})\b/i) || original.match(/^\s*([a-z]?\d{2,4})\s*$/i);
            if (room) resolved.room = room[1].toUpperCase();
        }

        if (!resolved.location && resolved.building) resolved.location = resolved.building;
        if (/^my room$/i.test(cleanText(original))) delete resolved.location;

        const date = extractDate(original);
        const time = extractTime(original);
        if (date) resolved.incidentDate = date;
        if (time) resolved.incidentTime = time;

        const witness = original.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+witnessed\b/) ||
            original.match(/\b(?:witness(?:ed)? by|witness was|witness is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
        if (witness) resolved.witnesses = witness[1];
        else if (/\bwitness(?:ed|es)?\b/i.test(original)) resolved.witnesses = 'Witness reported by complainant';

        const seniors = lower.match(/\b(\d+|one|two|three|four|five)\s+senior(?:\s+students?)?\b/);
        if (seniors) resolved.personsInvolved = `${seniors[1]} senior students`;
        else if (lower.includes('senior students')) resolved.personsInvolved = 'senior students';

        if (lower.includes('wifi') || lower.includes('wi-fi')) resolved.networkType = 'WiFi';
        if (lower.includes('lan')) resolved.networkType = 'LAN';
        if (lower.includes('fan')) resolved.equipment = 'Fan';
        if (lower.includes('light')) resolved.equipment = 'Light';
        if (lower.includes('breakfast')) resolved.meal = 'Breakfast';
        if (lower.includes('lunch')) resolved.meal = 'Lunch';
        if (lower.includes('dinner')) resolved.meal = 'Dinner';

        if (lower.includes('yesterday evening')) resolved.startedAt = 'Yesterday evening';
        else if (lower.includes('yesterday')) resolved.startedAt = 'Yesterday';
        else if (lower.includes('today')) resolved.startedAt = 'Today';
        else {
            const since = original.match(/\b(?:since|from|started)\s+([^.,]+)/i);
            if (since) resolved.startedAt = titleCase(since[1]);
        }

        if (lower.includes('forced me to sing') || lower.includes('forced to sing')) {
            resolved.issue = 'the student was forced to sing';
        }
        if (lower.includes('crack') && (lower.includes('wall') || lower.includes('staircase') || lower.includes('ceiling'))) {
            resolved.issue = 'structural crack posing a safety risk';
        }
        if (lower.includes('threatened')) {
            resolved.issue = resolved.issue
                ? `${resolved.issue} and the student was threatened with consequences if the matter was reported`
                : 'the student was threatened with consequences if the matter was reported';
        }
        if (!resolved.issue) {
            if (lower.includes('wifi') || lower.includes('wi-fi')) resolved.issue = 'WiFi connectivity issue';
            else if (lower.includes('fan')) resolved.issue = 'fan not working';
            else if (lower.includes('washroom')) resolved.issue = 'washroom sanitation issue';
            else if (lower.includes('food')) resolved.issue = 'food quality issue';
            else if (lower.includes('water leak') || lower.includes('leakage')) resolved.issue = 'water leakage';
            else if (lower.includes('broken chair')) resolved.issue = 'broken chair';
        }

        return resolved;
    }
}

export default new EntityResolver();
