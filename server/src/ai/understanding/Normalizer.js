export const normalizeText = (text) => {
    if (!text) return '';
    return text.trim()
        .toLowerCase()
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .replace(/\s+/g, ' ');
};
