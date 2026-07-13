import { parseInput } from '../understanding/Parser.js';
import { classifyIntent } from '../understanding/IntentClassifier.js';
import { extractEntities } from '../understanding/EntityExtractor.js';
import { resolveEntities } from '../understanding/EntityResolver.js';
import { calculateConfidence } from '../understanding/ConfidenceCalculator.js';

class UnderstandingPipeline {
    async process(text) {
        const parsed = parseInput(text);
        const classified = classifyIntent(parsed);
        const extracted = extractEntities(parsed);
        const resolved = await resolveEntities(extracted);
        const evaluated = calculateConfidence(classified, resolved);

        return {
            intent: evaluated.intent,
            confidence: evaluated.finalConfidence,
            entities: resolved,
            parsed
        };
    }
}

export default new UnderstandingPipeline();
