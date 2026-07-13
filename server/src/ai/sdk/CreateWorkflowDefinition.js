import DraftEngine from '../services/DraftEngine.js';

const DEFAULT_CONFIRM_WORDS = ['confirm', 'submit', 'create', 'publish', 'send', 'yes', 'looks good', 'go ahead', 'proceed'];
const DEFAULT_CANCEL_WORDS = ['cancel', 'stop', 'abort', 'discard'];

const titleCase = (value) => String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const sentence = (value) => {
    const text = String(value || '').trim();
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).replace(/\s+/g, ' ');
};

const fieldLabel = (schema, field) => schema?.properties?.[field]?.label || titleCase(field);

const conditionMatches = (condition, fields = {}) => {
    if (!condition) return true;
    if (Array.isArray(condition)) return condition.some(item => conditionMatches(item, fields));
    return Object.entries(condition).every(([key, expected]) => {
        const actual = fields[key];
        if (Array.isArray(expected)) return expected.includes(actual);
        if (expected && typeof expected === 'object') {
            if (expected.not !== undefined) return actual !== expected.not;
            if (expected.exists === true) return actual !== undefined && actual !== null && actual !== '';
            if (expected.exists === false) return actual === undefined || actual === null || actual === '';
        }
        return actual === expected;
    });
};

export default class CreateWorkflowDefinition {
    constructor(config) {
        this.capabilityId = config.capabilityId;
        this.entityName = config.entityName;
        this.schemaId = config.schemaId || config.capabilityId;
        this.schema = config.schema || null;
        this.requiredFields = config.requiredFields || [];
        this.optionalFields = config.optionalFields || [];
        this.previewFields = config.previewFields || [...this.requiredFields, ...this.optionalFields];
        this.prompts = config.prompts || {};
        this.infer = config.infer || (() => ({}));
        this.composeDraft = config.composeDraft || null;
        this.formatPreview = config.formatPreview || this.defaultFormatPreview;
        this.applyEdit = config.applyEdit || this.defaultApplyEdit;
        this.confirmWords = config.confirmWords || DEFAULT_CONFIRM_WORDS;
        this.cancelWords = config.cancelWords || DEFAULT_CANCEL_WORDS;
        this.redirects = config.redirects || [];
        this.entity = config.entity || String(config.entityName || '').toLowerCase().replace(/\s+/g, '-');
        this.redirect = config.redirect || null;
        this.action = config.action || 'AI_DRAFT_REDIRECT';
    }

    isConfirm(text) {
        const lower = String(text || '').toLowerCase().trim();
        return this.confirmWords.some(word => lower === word || lower.includes(word));
    }

    isCancel(text) {
        const lower = String(text || '').toLowerCase().trim();
        return this.cancelWords.some(word => lower === word || lower.includes(word));
    }

    isEdit(text) {
        const lower = String(text || '').toLowerCase().trim();
        return lower === 'edit' || lower.startsWith('change ') || lower.startsWith('update ') ||
            lower.startsWith('remove ') || lower.startsWith('add ') || lower.includes(' should be ');
    }

    getRequiredFields(state) {
        if (this.schema?.properties) {
            return Object.entries(this.schema.properties)
                .filter(([, meta]) => meta.required === true || (meta.requiredIf !== undefined && conditionMatches(meta.requiredIf, state?.fields || {})))
                .map(([field]) => field);
        }

        const dynamic = typeof this.requiredFields === 'function'
            ? this.requiredFields(state)
            : this.requiredFields;
        return [...new Set(dynamic || [])];
    }

    async inferEntities({ parsed, entities, state, context }) {
        const inferred = await this.infer({ parsed, entities, state, context });
        return { ...entities, ...inferred };
    }

    getPrompt(field, schema, state) {
        if (this.prompts[field]) {
            return typeof this.prompts[field] === 'function'
                ? this.prompts[field](state)
                : this.prompts[field];
        }

        const label = fieldLabel(schema, field);
        return `Please share ${label.toLowerCase()}.`;
    }

    async buildDraft({ fields, context }) {
        const draft = this.composeDraft
            ? await this.composeDraft({ fields, context })
            : DraftEngine.build(this.entity, fields);
        return {
            ...fields,
            ...draft
        };
    }

    defaultComposeDraft({ fields }) {
        const title = fields.title ? titleCase(fields.title) : `${this.entityName} Request`;
        const description = fields.description || fields.content || '';
        return {
            ...fields,
            title,
            description: sentence(description)
        };
    }

    buildPreview(draft) {
        return this.formatPreview({ draft, previewFields: this.previewFields, entityName: this.entityName });
    }

    buildDraftDto(draft) {
        return {
            ...DraftEngine.toRedirectDto({
                entity: this.entity,
                redirect: this.redirect,
                draft
            })
        };
    }

    defaultFormatPreview({ draft, previewFields, entityName }) {
        const fields = previewFields
            .filter(field => draft[field] !== undefined && draft[field] !== null && draft[field] !== '')
            .map(field => ({ key: field, label: titleCase(field), value: draft[field] }));

        return {
            title: `${entityName} Preview`,
            fields,
            actions: ['Edit', 'Confirm', 'Cancel']
        };
    }

    defaultApplyEdit(draft, text) {
        const lower = String(text || '').toLowerCase().trim();
        const next = { ...draft };

        const changeMatch = lower.match(/^(?:change|update)\s+([a-z]+)\s+(?:to|as)\s+(.+)$/i);
        const shouldMatch = lower.match(/^([a-z]+)\s+should\s+be\s+(.+)$/i);
        const removeMatch = lower.match(/^remove\s+([a-z]+)$/i);

        if (changeMatch) {
            next[changeMatch[1]] = changeMatch[2].trim();
            return next;
        }

        if (shouldMatch) {
            next[shouldMatch[1]] = shouldMatch[2].trim();
            return next;
        }

        if (removeMatch) {
            delete next[removeMatch[1]];
            return next;
        }

        next.description = next.description
            ? `${next.description} ${sentence(text)}`
            : sentence(text);
        return next;
    }
}
