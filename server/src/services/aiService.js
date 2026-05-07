/**
 * LEGACY WRAPPER
 * This file has been refactored into the new /services/ai domain architecture.
 * We export the AiOrchestrator here to maintain backward compatibility with existing route imports.
 */
import aiOrchestrator from './ai/orchestrator/AiOrchestrator.js';

export default aiOrchestrator;
