export const calculateConfidence = (intentData, entities) => {
    let score = intentData.confidence;

    // Adjust score based on extracted entity density
    const keysCount = Object.keys(entities).length;
    if (keysCount > 0) score += 0.05;
    if (score > 1.0) score = 1.0;

    return {
        ...intentData,
        finalConfidence: score
    };
};
