import { GoogleGenerativeAI } from "@google/generative-ai";
import Complaint from '../models/Complaint.js';
import Leave from '../models/Leave.js';
import User from '../models/User.js';

export class AiService {
    constructor() {
        this.genAI = null;
        this.model = null;
    }

    init() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY is not set in .env. Agentic features are disabled.");
            return false;
        }
        if (!this.genAI) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            
            const routeRequestDeclaration = {
                name: "route_request",
                description: "You are a router. You MUST use this tool to classify the user's intent and provide necessary data.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        intent: { 
                            type: "STRING", 
                            description: "Classify the intent. MUST be one of: 'SOS' (for injuries, medical emergencies, danger), 'COMPLAINT' (for reporting issues or bad behavior like ragging), 'LEAVE' (for applying for leave), 'CHAT' (for general questions)." 
                        },
                        chatResponse: {
                            type: "STRING",
                            description: "If intent is CHAT, put your friendly response here."
                        },
                        complaintTitle: {
                            type: "STRING",
                            description: "If intent is COMPLAINT, generate a formal title."
                        },
                        complaintDescription: {
                            type: "STRING",
                            description: "If intent is COMPLAINT, generate an elaborative 2-3 paragraph description. Use generic placeholders if details are missing."
                        },
                        leaveType: { type: "STRING", description: "If intent is LEAVE. 'Night Out', 'Home Visit', or 'Medical'." },
                        leaveStartDate: { type: "STRING", description: "If intent is LEAVE. YYYY-MM-DD" },
                        leaveEndDate: { type: "STRING", description: "If intent is LEAVE. YYYY-MM-DD" },
                        leaveReason: { type: "STRING", description: "If intent is LEAVE." }
                    },
                    required: ["intent"]
                }
            };

            this.model = this.genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: `You are the CampusCare AI Router. 
                - If the user mentions ANY injury (broke my nose, bleeding, pain) or emergency, set intent to 'SOS'. DO NOT GIVE MEDICAL ADVICE.
                - If the user reports bad behavior (ragging) or broken facilities, set intent to 'COMPLAINT'.
                - If the user wants to take a leave, set intent to 'LEAVE'.
                - Otherwise, set intent to 'CHAT' and provide a friendly response.`,
                tools: [{
                    functionDeclarations: [routeRequestDeclaration]
                }],
                toolConfig: {
                    functionCallingConfig: {
                        mode: "ANY",
                        allowedFunctionNames: ["route_request"]
                    }
                }
            });
        }
        return true;
    }

    async processInput(text, user, history = []) {
        if (!this.init()) {
            return { message: "AI Assistant is currently unavailable.", action: "ERROR" };
        }

        try {
            const chat = this.model.startChat({ history: history });
            
            // Wrap the input to prevent RLHF from triggering conversational medical disclaimers
            const classificationPrompt = `Analyze the following user input and execute the appropriate tool action. DO NOT reply with text, ONLY use the route_request tool.
User Input: "${text}"`;
            
            let result = await chat.sendMessage(classificationPrompt);
            let response = result.response;
            
            let forcedAction = "AI_RESPONSE";
            let forcedData = null;
            let finalMessage = "I'm not sure how to handle that.";

            if (response.functionCalls && response.functionCalls.length > 0) {
                const call = response.functionCalls[0];
                console.log(`Gemini routed intent:`, call.args);
                
                const args = call.args;

                if (args.intent === 'SOS') {
                    forcedAction = "TRIGGER_SOS";
                    forcedData = { type: "Emergency Detected" };
                    finalMessage = "SOS Triggered. Please seek help immediately.";
                } 
                else if (args.intent === 'COMPLAINT') {
                    forcedAction = "REDIRECT_TO_COMPLAINT";
                    forcedData = { 
                        title: args.complaintTitle || "Campus Complaint", 
                        description: args.complaintDescription || "Please detail your complaint here." 
                    };
                    finalMessage = "I have drafted your complaint. Redirecting you to the form...";
                }
                else if (args.intent === 'LEAVE') {
                    if (!user) {
                        finalMessage = "You must be logged in to apply for leave.";
                    } else {
                        const leaveType = ['Night Out', 'Home Visit', 'Medical'].includes(args.leaveType) ? args.leaveType : 'Home Visit';
                        const newLeave = await Leave.create({
                            student: user._id,
                            type: leaveType,
                            startDate: new Date(args.leaveStartDate || Date.now()),
                            endDate: new Date(args.leaveEndDate || Date.now()),
                            reason: args.leaveReason || "Personal",
                            status: 'Pending HOD Approval'
                        });
                        finalMessage = `Leave application submitted successfully. Status is Pending.`;
                    }
                }
                else {
                    // CHAT
                    finalMessage = args.chatResponse || "Hello! How can I help you today?";
                }
            }

            return {
                message: finalMessage,
                action: forcedAction,
                data: forcedData
            };

        } catch (error) {
            console.error("Gemini API Error:", error);
            
            // LOCAL FALLBACK: If API is down (503) or fails, use basic keyword matching to ensure critical functions still work
            const lowerText = text.toLowerCase();
            
            if (lowerText.includes('broke') || lowerText.includes('fracture') || lowerText.includes('bleeding') || lowerText.includes('hurt') || lowerText.includes('fire') || lowerText.includes('pain') || lowerText.includes('emergency')) {
                return {
                    message: "SOS Triggered locally due to API high demand. Please seek help immediately.",
                    action: "TRIGGER_SOS",
                    data: { type: "Emergency Detected" }
                };
            }
            
            if (lowerText.includes('ragging') || lowerText.includes('complain') || lowerText.includes('issue') || lowerText.includes('broken')) {
                return {
                    message: "I have drafted your complaint locally. Redirecting you to the form...",
                    action: "REDIRECT_TO_COMPLAINT",
                    data: { title: "Campus Complaint", description: text }
                };
            }

            if (lowerText.includes('assignment') || lowerText.includes('homework')) {
                return { message: "I'm currently running in offline mode due to high API demand. Please check your Student Dashboard to submit assignments.", action: "AI_RESPONSE" };
            }

            if (lowerText.includes('routine') || lowerText.includes('schedule') || lowerText.includes('class')) {
                return { message: "I'm currently running in offline mode. Please check the Routine section on your dashboard to see your schedule.", action: "AI_RESPONSE" };
            }

            if (lowerText.includes('leave') || lowerText.includes('holiday')) {
                return { message: "I'm currently running in offline mode. Please navigate to the Leaves section to submit a leave application manually.", action: "AI_RESPONSE" };
            }

            return {
                message: "Hello! My AI brain is currently experiencing high demand (503 Error) and is temporarily offline. My critical emergency features are still active, but for general questions, please try again later or use the dashboard menus.",
                action: "AI_RESPONSE"
            };
        }
    }

    async generateComplaintDraft(prompt, user) {
        if (!this.init()) {
            throw new Error("AI not configured");
        }

        const draftPrompt = `You are a helpful assistant. The user wants to file a complaint about: "${prompt}".
Please generate a formal "title" and a well-described, detailed "description" for this complaint.
Expand on the user's input to make it professional and comprehensive.
IMPORTANT: You MUST include blank placeholders (like [Insert Name], [Date], [Location], [Specify details], etc.) for any specific details that are missing but necessary for a formal complaint.
Respond ONLY with a raw JSON object containing "title" and "description" keys. No markdown formatting, no backticks.
Example: {"title": "Formal Complaint Regarding [Issue]", "description": "To the concerned authority,\n\nI am writing to formally lodge a complaint regarding [Issue] that occurred on [Date] at [Location]. [Expand issue here...]"}`;

        try {
            const result = await this.model.generateContent(draftPrompt);
            const text = result.response.text().trim();
            // Try to parse it, even if it has some formatting
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error("Generate Draft Error:", error);
            throw new Error("Failed to generate draft text");
        }
    }
}

export default new AiService();
