import { getFunctionDeclarations } from '../server/src/services/ai/security/ToolRegistry.js';
console.log(JSON.stringify(getFunctionDeclarations(), null, 2));
