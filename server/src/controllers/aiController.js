import aiService from '../services/aiService.js';

export const handleChat = async (req, res) => {
    try {
        console.log("AI Chat Request Body:", req.body);
        const { text } = req.body;

        if (!text) {
            console.warn("AI Chat: No text provided");
            return res.status(400).json({ error: "Text input is required" });
        }

        const result = aiService.processInput(text);
        console.log("AI Chat Result:", JSON.stringify(result, null, 2));
        res.status(200).json(result);

    } catch (error) {
        console.error("AI Controller Error:", error);
        res.status(500).json({ error: "Internal AI Processing Error" });
    }
};
