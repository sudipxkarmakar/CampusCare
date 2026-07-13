import aiService from '../services/aiService.js';

export const handleGetStatus = async (req, res) => {
    res.status(200).json({
        presentationState: 'IDLE',
        message: 'Ready.'
    });
};

export const handleChat = async (req, res, next) => {
    try {
        const { text, conversationId, clientContext = {} } = req.body;
        if (!text || !String(text).trim()) {
            return res.status(400).json({ error: 'Text input is required' });
        }

        // Import the V5 processAIInput coordinator
        const { processAIInput } = await import('../ai/index.js');
        const result = await processAIInput(text, req.user, conversationId, clientContext);

        if (req.headers.accept === 'text/event-stream') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.write(`data: ${JSON.stringify({ type: 'final', response: result })}\n\n`);
            return res.end();
        }

        res.status(200).json({ response: result });
    } catch (error) {
        next(error);
    }
};

export const handleGenerateComplaint = async (req, res, next) => {
    try {
        const { prompt } = req.body;
        if (!prompt || !String(prompt).trim()) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const draft = await aiService.generateComplaintDraft(prompt, req.user);
        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
};

export const handleGenerateNotice = async (req, res, next) => {
    try {
        const { prompt } = req.body;
        if (!prompt || !String(prompt).trim()) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const draft = await aiService.generateNoticeDraft(prompt, req.user);
        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
};

export const handleGenerateLeaderMessage = async (req, res, next) => {
    try {
        const { prompt } = req.body;
        // Prompt can be optional for general messages
        const draft = await aiService.generateLeaderMessageDraft(prompt, req.user);
        res.status(200).json(draft);
    } catch (error) {
        next(error);
    }
};
