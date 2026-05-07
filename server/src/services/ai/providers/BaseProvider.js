export class BaseProvider {
    /**
     * @param {Array} messages Conversation history
     * @param {Array|null} tools Array of tool declarations
     * @param {string} toolChoice "auto" or "none"
     * @returns {Promise<{ content: string, toolCalls: Array, usage: Object, finishReason: string, provider: string, latency: number, requestId: string, streaming: boolean, raw: Object }>}
     */
    async generateResponse(messages, tools, toolChoice) {
        throw new Error("Method not implemented.");
    }
}
