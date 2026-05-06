import aiService from '../services/aiService.js';

export const handleChat = async (req, res) => {
    try {
        console.log("AI Chat Request Body:", req.body);
        const { text, history, conversationId } = req.body;
        const user = req.user;

        if (!text) {
            console.warn("AI Chat: No text provided");
            return res.status(400).json({ error: "Text input is required" });
        }
        
        if (text.length > 5000) {
            console.warn("AI Chat: Input exceeds 5000 characters.");
            return res.status(400).json({ error: "Input text exceeds maximum length of 5000 characters." });
        }

        // Now processInput is an async function that communicates with Gemini
        const result = await aiService.processInput(text, user, history, conversationId);
        console.log("AI Chat Result:", JSON.stringify(result, null, 2));
        
        // Return exactly what the frontend expects
        res.status(200).json({ response: result });

    } catch (error) {
        console.error("AI Controller Error:", error);
        res.status(500).json({ error: "Internal AI Processing Error", details: error.message });
    }
};

export const handleGenerateComplaint = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        const draft = await aiService.generateComplaintDraft(prompt, req.user);
        res.status(200).json(draft);
    } catch (error) {
        console.error("Generate Complaint Error:", error);
        res.status(500).json({ error: "Failed to generate complaint", details: error.message });
    }
};
