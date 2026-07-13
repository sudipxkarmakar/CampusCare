import AIKernel from '../kernel/AIKernel.js';
import PolicyEngine from '../policies/PolicyEngine.js';
import { resolveEntities } from '../understanding/EntityResolver.js';
import { extractEntities } from '../understanding/EntityExtractor.js';

const looksLikeLowConfidenceFieldValue = (value) => {
    const text = String(value || '').trim();
    if (!text) return true;
    if (text.length >= 8 && /^[a-z]+$/i.test(text) && !/[aeiou]/i.test(text)) return true;
    if (text.length >= 10 && /^[A-Z]+$/.test(text)) return true;
    if (/^[^a-z0-9]+$/i.test(text)) return true;
    return false;
};

class ConversationEngine {
    mergeResolvedFields(resolved, requiredFields, schema, session) {
        const knownFields = new Set([
            ...requiredFields,
            ...Object.keys(schema?.properties || {})
        ]);

        for (const [key, val] of Object.entries(resolved || {})) {
            if (knownFields.has(key) && val !== undefined && val !== null && val !== '') {
                session.workingMemory.set(key, val);
                session.workflowMemory.collectedFields[key] = val;
            }
        }
    }

    // 1. Response Interpreter Layer
    interpretResponse(text, expectedField, schema, currentIntent) {
        const lower = text.toLowerCase().trim();
        
        if (['cancel', 'stop', 'abort', 'reset'].includes(lower)) {
            return { type: 'CANCELLATION' };
        }
        if (['yes', 'yup', 'ok', 'correct', 'confirm', 'go ahead', 'proceed'].includes(lower)) {
            return { type: 'CONFIRMATION' };
        }
        if (['no', 'nope', 'incorrect', 'change', 'edit', 'fix'].includes(lower)) {
            return { type: 'CORRECTION' };
        }
        if (lower.startsWith('why') || lower.endsWith('?') || lower.includes('what is')) {
            return { type: 'QUESTION' };
        }

        // Check if input is a new intent by checking kernel commands synonyms
        for (const cmd of AIKernel.commands) {
            if (cmd.synonyms.some(syn => lower.includes(syn.toLowerCase())) && cmd.capabilityId !== currentIntent) {
                return { type: 'NEW_INTENT', targetIntent: cmd.capabilityId };
            }
        }

        return { type: 'FIELD_VALUE', value: text };
    }

    // 2. Schema dependency resolver
    getRequiredFields(intent, workingMemory) {
        const schema = AIKernel.getSchema(intent);
        if (!schema) return [];

        return [...(schema.required || [])];
    }

    async handle(inputData, session) {
        let { intent, entities, parsed } = inputData;

        // If intent is GENERAL, resolve active workflow
        if (intent === 'GENERAL' && session.workflowMemory.activeWorkflowId) {
            intent = session.workflowMemory.activeWorkflowId;
        }

        const schema = AIKernel.getSchema(intent);
        const workflow = AIKernel.getWorkflow(intent);
        if (!schema) {
            return {
                status: 'RESOLVED',
                intent,
                args: entities,
                message: `Executing Capability: ${intent}`
            };
        }

        const startedWorkflow = session.workflowMemory.activeWorkflowId !== intent;

        if (startedWorkflow) {
            const capability = AIKernel.getCapability(intent);
            if (capability?.validate) {
                const validation = await capability.validate({ user: session.user, session });
                if (!validation.success) {
                    session.workflowMemory.clear();
                    session.workingMemory.clear();
                    return {
                        status: 'POLICY_BLOCKED',
                        intent,
                        message: validation.message || 'You are not allowed to start this workflow from your current account.',
                        payload: { intent }
                    };
                }
            }
        }

        if (intent === 'raiseComplaint' && startedWorkflow) {
            const currentExtracted = extractEntities(parsed);
            const currentResolved = await resolveEntities(currentExtracted);
            const inferred = workflow
                ? await workflow.inferEntities({
                    parsed,
                    entities: { ...entities, ...currentResolved },
                    state: { session, fields: {} },
                    context: { session }
                })
                : { ...entities, ...currentResolved };
            const category = inferred.category || entities?.category || 'Other';
            const eligibility = PolicyEngine.evaluateComplaintEligibility({
                user: session.user,
                category,
                fields: inferred
            });

            if (!eligibility.success) {
                session.workflowMemory.clear();
                session.workingMemory.clear();
                return {
                    status: 'POLICY_BLOCKED',
                    intent,
                    category,
                    message: eligibility.reason,
                    payload: {
                        category,
                        alternativeAction: eligibility.alternativeAction,
                        failedConditions: eligibility.failedConditions || []
                    }
                };
            }
        }

        // Start workflow memory tracking
        if (startedWorkflow) {
            session.workflowMemory.start(intent);
        }

        if (workflow && session.workflowMemory.draft) {
            const text = parsed?.original || '';

            if (workflow.isCancel(text)) {
                session.workflowMemory.clear();
                session.workingMemory.clear();
                return {
                    status: 'RESOLVED',
                    intent: 'cancel',
                    args: {},
                    message: `${workflow.entityName} draft cancelled.`
                };
            }

            if (workflow.isConfirm(text)) {
                const draftDto = workflow.buildDraftDto(session.workflowMemory.draft);
                session.workflowMemory.clear();
                session.workingMemory.clear();
                return {
                    status: 'DRAFT_REDIRECT',
                    intent,
                    payload: draftDto,
                    draft: draftDto.draft,
                    message: `I've prepared a ${workflow.entityName.toLowerCase()} draft. Nothing has been submitted yet.`
                };
            }

            if (String(text || '').toLowerCase().trim() === 'edit') {
                session.workflowMemory.touch('edit');
                return {
                    status: 'COLLECTING',
                    intent,
                    promptField: 'edit',
                    message: `What would you like to change in the ${workflow.entityName.toLowerCase()} draft?`
                };
            }

            const editedDraft = await workflow.applyEdit(session.workflowMemory.draft, text, { session });
            const preview = workflow.buildPreview(editedDraft);
            session.workflowMemory.setDraft(editedDraft, preview);

            return {
                status: 'PREVIEW',
                intent,
                draft: editedDraft,
                preview,
                message: `I updated the ${workflow.entityName.toLowerCase()} draft. Please review it before I execute anything.`
            };
        }

        // Determine next missing field before current input is processed
        const state = { session, fields: session.workflowMemory.collectedFields };
        let requiredFields = workflow ? workflow.getRequiredFields(state) : this.getRequiredFields(intent, session.workingMemory);
        const nextMissingField = requiredFields.find(field => {
            return session.workingMemory.get(field) === undefined || session.workingMemory.get(field) === null;
        });

        // Run Entity Resolver to extract parameters from current message
        const currentExtracted = extractEntities(parsed);
        const currentResolved = await resolveEntities(currentExtracted);
        const workflowResolved = workflow
            ? await workflow.inferEntities({ parsed, entities: { ...entities, ...currentResolved }, state, context: { session } })
            : currentResolved;
        
        // Merge resolved entities to working memory
        this.mergeResolvedFields(workflowResolved, requiredFields, schema, session);

        // Process Response Interpretation if answering the next missing field prompt
        if (
            !startedWorkflow &&
            nextMissingField &&
            parsed &&
            parsed.original &&
            (session.workingMemory.get(nextMissingField) === undefined || session.workingMemory.get(nextMissingField) === null)
        ) {
            const interpretation = this.interpretResponse(parsed.original, nextMissingField, schema, intent);

            if (interpretation.type === 'CANCELLATION') {
                session.workflowMemory.clear();
                session.workingMemory.clear();
                return {
                    status: 'RESOLVED',
                    intent: 'cancel',
                    args: {},
                    message: 'Workflow cancelled.'
                };
            }

            if (interpretation.type === 'NEW_INTENT') {
                session.workflowMemory.clear();
                session.workingMemory.clear();
                return {
                    status: 'REDIRECTED',
                    intent: interpretation.targetIntent,
                    message: `Redirecting to new action: ${interpretation.targetIntent}`
                };
            }

            if (interpretation.type === 'QUESTION') {
                const fieldMeta = schema.properties[nextMissingField] || {};
                return {
                    status: 'COLLECTING',
                    intent,
                    promptField: nextMissingField,
                    message: workflow
                        ? workflow.getPrompt(nextMissingField, schema, state)
                        : `I need this to compile your request properly.\n\nRequired field: **${fieldMeta.label}**\nDescription: ${fieldMeta.placeholder || 'Please provide a valid input value'}`
                };
            }

            if (interpretation.type === 'FIELD_VALUE') {
                let value = interpretation.value;
                const fieldMeta = schema.properties[nextMissingField] || {};
                const lowerValue = String(value || '').toLowerCase();

                if (looksLikeLowConfidenceFieldValue(value)) {
                    return {
                        status: 'COLLECTING',
                        intent,
                        promptField: nextMissingField,
                        message: `I did not understand that. ${workflow ? workflow.getPrompt(nextMissingField, schema, state) : `${fieldMeta.label}?`}`
                    };
                }

                if (
                    nextMissingField === 'assignmentId' &&
                    (lowerValue.includes("don't know") || lowerValue.includes('dont know') || lowerValue.includes('you tell me') || lowerValue.includes('show') || lowerValue.includes('list'))
                ) {
                    return {
                        status: 'COLLECTING',
                        intent,
                        promptField: nextMissingField,
                        message: 'Please pick an assignment from your assignments module, or ask "how many assignments do I have?" before starting the submission draft.'
                    };
                }

                // Validate and Normalize values before storing them
                if (fieldMeta.enum && !fieldMeta.enum.includes(value)) {
                    if (nextMissingField === 'category') {
                        const lowerVal = value.toLowerCase();
                        if (lowerVal.includes('ragged') || lowerVal.includes('disciplinary')) value = 'Disciplinary';
                        else if (lowerVal.includes('fan') || lowerVal.includes('light')) value = 'Electrical';
                        else if (lowerVal.includes('water') || lowerVal.includes('dirty')) value = 'Sanitation';
                        else if (lowerVal.includes('wifi') || lowerVal.includes('internet')) value = 'IT';
                        else value = 'Other';
                    } else {
                        value = fieldMeta.enum[0];
                    }
                }

                session.workingMemory.set(nextMissingField, value);
                session.workflowMemory.collectedFields[nextMissingField] = value;
            }
        }

        // Re-evaluate required fields dynamically (with conditional requirements)
        requiredFields = workflow ? workflow.getRequiredFields(state) : this.getRequiredFields(intent, session.workingMemory);
        const missingField = requiredFields.find(field => {
            return session.workingMemory.get(field) === undefined || session.workingMemory.get(field) === null;
        });

        if (missingField) {
            const fieldMeta = schema.properties[missingField] || { label: missingField };
            return {
                status: 'COLLECTING',
                intent,
                promptField: missingField,
                message: workflow ? workflow.getPrompt(missingField, schema, state) : `${fieldMeta.label}?`
            };
        }

        // All fields gathered
        const finalArgs = { ...session.workflowMemory.collectedFields };
        if (workflow) {
            const draft = await workflow.buildDraft({ fields: finalArgs, context: { session } });
            const preview = workflow.buildPreview(draft);
            session.workflowMemory.setDraft(draft, preview);
            const draftDto = workflow.buildDraftDto(draft);
            session.workflowMemory.clear();
            session.workingMemory.clear();

            return {
                status: 'DRAFT_REDIRECT',
                intent,
                payload: draftDto,
                draft,
                preview,
                message: `I've prepared a ${workflow.entityName.toLowerCase()} draft based on the information you shared.`
            };
        }

        session.workflowMemory.clear();
        session.workingMemory.clear();

        return {
            status: 'RESOLVED',
            intent,
            args: finalArgs
        };
    }
}

export default new ConversationEngine();
