import { normalizeText } from './Normalizer.js';

export const parseInput = (text) => {
    const normalized = normalizeText(text);
    const words = normalized.split(' ').filter(Boolean);
    return {
        original: text,
        normalized,
        words
    };
};
