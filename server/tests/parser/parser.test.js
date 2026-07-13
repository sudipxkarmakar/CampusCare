import { classifyIntent } from '../../src/ai/understanding/IntentClassifier.js';
import { parseInput } from '../../src/ai/understanding/Parser.js';
import { extractEntities } from '../../src/ai/understanding/EntityExtractor.js';
import assert from 'assert';

console.log('Running parser & intent classifier unit tests...');

// 1. Basic parser tests
const parsed = parseInput('Raise a complaint about WiFi not working');
assert.strictEqual(parsed.words[0], 'raise');
assert.strictEqual(parsed.words[1], 'a');
assert.strictEqual(parsed.words[2], 'complaint');

// 2. Intent classification tests
const intentObj = classifyIntent(parsed);
assert.strictEqual(intentObj.intent, 'raiseComplaint');

// 3. Entity extraction tests
const entities = extractEntities(parsed);
assert.strictEqual(entities.category, 'IT'); // WiFi maps to IT via synonyms

const parsedIT = parseInput('IT Complaint wifi broken');
const entitiesIT = extractEntities(parsedIT);
assert.strictEqual(entitiesIT.category, 'IT');

console.log('Parser and Intent unit tests passed successfully!');
