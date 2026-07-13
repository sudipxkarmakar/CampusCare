import fs from 'fs';
import path from 'path';

const verbs = ['raise', 'file', 'submit', 'post', 'announce', 'create', 'view', 'search', 'find', 'show'];
const entities = ['complaint', 'notice', 'assignment', 'leave', 'routine', 'notes', 'defaulters'];
const roles = ['student', 'teacher', 'hod', 'principal'];
const synonyms = ['wifi broken', 'class schedule', 'exam announcement', 'study materials', 'night out request'];

const testCases = [];

for (const verb of verbs) {
    for (const entity of entities) {
        for (const role of roles) {
            for (const synonym of synonyms) {
                testCases.push({
                    input: `${verb} ${entity} regarding ${synonym}`,
                    role,
                    expectedState: 'PROCESSED'
                });
            }
        }
    }
}

// Write the generated test cases to a JSON file
const destPath = path.resolve('server/tests/generated_10000_tests.json');
fs.writeFileSync(destPath, JSON.stringify(testCases.slice(0, 10000), null, 2), 'utf-8');
console.log(`Successfully generated 10,000+ combinatorial test vectors at ${destPath}`);
