import { analyzeComplaint } from './src/utils/aiService.js';

const test = async () => {
    console.log("Testing Heuristics...");

    const cases = [
        "I lost my power bank",
        "My phone was stolen",
        "I cant find my wallet",
        "missing keys",
        "Gold bracelet is lost"
    ];

    for (const text of cases) {
        try {
            const result = await analyzeComplaint(text);
            console.log(`Text: "${text}" -> Category: ${result.category}, Priority: ${result.priority}`);

            if (result.priority !== 'Urgent') {
                console.error(`FAILED: Expected Urgent for "${text}"`);
            } else {
                console.log("PASS");
            }
        } catch (e) {
            console.error(e);
        }
    }
};

test();
