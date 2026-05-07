import AIActionLog from '../../../models/AIActionLog.js';
import { EXECUTION_STATUS, CONFIRMATION_STATUS } from '../../../constants/aiConstants.js';
import { WorkflowExecutionError, OCCConflictError } from '../../../utils/errors.js';

export class StateManager {
    static isValidTransition(currentState, attemptedState) {
        const transitions = {
            [EXECUTION_STATUS.PENDING_CONFIRMATION]: [EXECUTION_STATUS.EXECUTING, EXECUTION_STATUS.CANCELLED, EXECUTION_STATUS.EXPIRED],
            [EXECUTION_STATUS.EXECUTING]: [EXECUTION_STATUS.COMPLETED, EXECUTION_STATUS.FAILED],
            [EXECUTION_STATUS.COMPLETED]: [],
            [EXECUTION_STATUS.FAILED]: [],
            [EXECUTION_STATUS.CANCELLED]: [],
            [EXECUTION_STATUS.EXPIRED]: []
        };
        // Add DRAFTED if needed per user notes
        transitions['DRAFTED'] = [EXECUTION_STATUS.PENDING_CONFIRMATION, EXECUTION_STATUS.CANCELLED];
        
        return transitions[currentState]?.includes(attemptedState) || false;
    }

    /**
     * The ONLY gateway for mutating execution state.
     */
    static async transition(traceId, currentState, nextState, executionId = null, optionalUpdates = {}) {
        if (!this.isValidTransition(currentState, nextState)) {
            throw new WorkflowExecutionError(`Invalid FSM transition`, currentState, nextState, traceId);
        }

        const updatePayload = { 
            executionStatus: nextState, 
            ...optionalUpdates 
        };
        
        if (executionId) {
            updatePayload.executionId = executionId;
        }

        // Optimistic Concurrency Control
        const result = await AIActionLog.findOneAndUpdate(
            { traceId, executionStatus: currentState },
            updatePayload,
            { new: true, upsert: false }
        );

        if (!result) {
            throw new OCCConflictError(`State transition failed. Record not found or OCC conflict (expected state: ${currentState})`, currentState, nextState, traceId);
        }

        return result;
    }

    /**
     * Idempotent trace creation.
     */
    static async createTrace(conversationId, payload) {
        return await AIActionLog.findOneAndUpdate(
            { traceId: payload.traceId, conversationId },
            { $setOnInsert: payload },
            { upsert: true, new: true }
        );
    }
}
