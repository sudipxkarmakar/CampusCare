import { ValidationError } from '../../../utils/errors.js';

export class RepairEngine {
    /**
     * Pure function to attempt a repair on malformed tool arguments.
     * Keeps repair context entirely isolated from main conversation history.
     */
    static async attemptRepair(provider, toolName, schema, malformedPayload, rawError) {
        // Token Budgeting Defense
        const payloadString = typeof malformedPayload === 'string' ? malformedPayload : JSON.stringify(malformedPayload);
        const payloadBytes = Buffer.byteLength(payloadString, 'utf8');
        if (payloadBytes > 2048) {
            throw new ValidationError(`Malformed payload exceeds maximum repair budget (2KB).`, malformedPayload, true);
        }

        const sanitizedError = rawError.message.replace(/[\{\}\[\]"']/g, "").substring(0, 200);
        
        const repairMessages = [
            {
                role: "system",
                content: `You are an auto-correction JSON parser. Your ONLY job is to output perfectly formatted JSON matching the tool schema for '${toolName}'. Do not output any markdown formatting, do not output explanations. Just the JSON object.`
            },
            {
                role: "user",
                content: `The following payload failed validation.\n\nError:\n${sanitizedError}\n\nMalformed Payload:\n${malformedPayload}\n\nPlease provide the corrected JSON.`
            }
        ];

        try {
            // We pass null for tools to force a raw text JSON response
            const response = await provider.generateResponse(repairMessages, null, "none");
            
            let correctedContent = response.content.trim();
            // Clean up any potential markdown fences
            if (correctedContent.startsWith('```')) {
                const match = correctedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (match) correctedContent = match[1].trim();
            }

            const parsed = JSON.parse(correctedContent);
            const validation = schema.safeParse(parsed);
            
            if (!validation.success) {
                throw new ValidationError("Repair attempt failed validation again", malformedPayload, true);
            }
            
            return validation.data;
        } catch (err) {
            console.error(`[RepairEngine] Repair failed for tool ${toolName}:`, err.message);
            throw new ValidationError("Failed to parse tool arguments after repair attempts", malformedPayload, true);
        }
    }
}
