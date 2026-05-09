import Groq from "groq-sdk";
import { BaseProvider } from './BaseProvider.js';
import { AIProviderError, ValidationError } from '../../../utils/errors.js';

export class GroqProvider extends BaseProvider {
    constructor() {
        super();
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.warn("[GroqProvider] GROQ_API_KEY is missing or empty. AI features will be disabled.");
            this.groq = null;
        } else {
            this.groq = new Groq({ apiKey });
        }
    }

    async generateResponse(messages, tools = null, toolChoice = "auto") {
        if (!this.groq) {
            throw new AIProviderError("AI service is not configured (missing API key)", "groq");
        }
        const controller = new AbortController();
        let timeoutReject;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutReject = reject;
        });
        
        const timeoutId = setTimeout(() => {
            controller.abort();
            timeoutReject(new AIProviderError("AI_TIMEOUT", "groq"));
            
            // Hanging descriptor monitor - logs if SDK doesn't unblock event loop
            setTimeout(() => {
                console.warn("[CRITICAL] SDK socket may be hanging after AbortController was called.");
            }, 5000).unref();
            
        }, 30000); // 30s timeout
        
        let result;
        const startTime = Date.now();
        
        try {
            const providerCall = this.groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                tools: tools && tools.length > 0 ? tools : undefined,
                tool_choice: tools && tools.length > 0 ? toolChoice : undefined
            }, {
                signal: controller.signal
            });
            
            result = await Promise.race([providerCall, timeoutPromise]);
        } catch (err) {
            if (err.name === 'AbortError' || err.message === 'AI_TIMEOUT') {
                throw new AIProviderError("Request to AI provider timed out", "groq", err);
            }
            throw new AIProviderError(err.message || "Provider call failed", "groq", err);
        } finally {
            clearTimeout(timeoutId);
        }
        
        const responseMessage = result.choices[0].message;
        const latency = Date.now() - startTime;
        
        const rawToolCalls = responseMessage.tool_calls;
        
        if (Array.isArray(rawToolCalls)) {
            if (!rawToolCalls.every(tc => tc && tc.function)) {
                throw new ValidationError("Malformed tool calls array detected from provider", rawToolCalls);
            }
        }

        const normalizedToolCalls = Array.isArray(rawToolCalls) ? rawToolCalls.map(tc => {
            if (typeof tc?.function?.name !== 'string') {
                throw new ValidationError("Invalid tool call structure from provider", tc);
            }
            return {
                name: tc.function.name,
                arguments: tc.function.arguments,
                id: tc.id
            };
        }) : [];

        const raw = process.env.NODE_ENV === 'development' ? {
            id: result.id,
            model: result.model,
            choices: result.choices?.slice(0, 1),
            usage: result.usage
        } : undefined;

        // Return strict Normalized shape
        return {
            content: responseMessage.content || "",
            toolCalls: normalizedToolCalls,
            usage: result.usage || {},
            finishReason: result.choices[0].finish_reason,
            provider: "groq",
            latency: latency,
            requestId: result.id,
            streaming: false,
            raw
        };
    }
}
