import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const draftComplaintDeclaration = {
    name: "draft_complaint",
    description: "Use this tool to draft a complaint whenever the user expresses dissatisfaction, reports bad behavior (like ragging), or explicitly asks to file a complaint. This will redirect them to the complaint form. If the user provided brief info, GENERATE PLAUSIBLE PLACEHOLDERS (like [Location], [Time], [Details]) to flesh out the description. DO NOT ask the user for more details.",
    parameters: {
        type: "OBJECT",
        properties: {
            title: { type: "STRING", description: "A formal, concise title." },
            description: { type: "STRING", description: "A highly elaborative, formal, and detailed description of the complaint, consisting of 2-3 paragraphs." }
        },
        required: ["title", "description"]
    }
};

const triggerSosDeclaration = {
    name: "trigger_sos",
    description: "CRITICAL: Use this tool IMMEDIATELY if the user mentions ANY physical injury (broken bone, bleeding, fracture), medical issue, danger, fire, or emergency. Do not ask for more details.",
    parameters: {
        type: "OBJECT",
        properties: {
            confirmed: { type: "BOOLEAN", description: "Set to true" }
        }
    }
};

async function test() {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are the CampusCare AI Assistant. You are an AGENTIC AI. Your primary purpose is to execute actions using your tools.
        
        CRITICAL DIRECTIVES:
        1. EMERGENCY: If the user mentions ANY injury (e.g., 'broke my finger', 'cut myself', 'fracture'), illness, danger, or fear, YOU MUST CALL 'trigger_sos' IMMEDIATELY. DO NOT provide medical advice. DO NOT provide comfort. CALL THE TOOL.
        2. COMPLAINTS: If the user complains about someone or something (e.g., 'seniors are ragging me', 'fan is broken'), YOU MUST CALL 'draft_complaint'. DO NOT just say 'I am sorry to hear that'. DO NOT give them a list of things to do. CALL THE TOOL.
        
        If the user asks a general question that does not require a tool, keep your response short and friendly in Markdown.`,
        tools: [{
            functionDeclarations: [draftComplaintDeclaration, triggerSosDeclaration]
        }]
    });

    const chat = model.startChat({});
    console.log("Testing: 'broke my nose'");
    let result = await chat.sendMessage("broke my nose");
    
    if (result.response.functionCalls) {
        console.log("SUCCESS! Function call:", JSON.stringify(result.response.functionCalls, null, 2));
    } else {
        console.log("FAILED! Text response:", result.response.text());
    }

    const chat2 = model.startChat({});
    console.log("\nTesting: '3rd year students are ragging me'");
    let result2 = await chat2.sendMessage("3rd year students are ragging me");
    
    if (result2.response.functionCalls) {
        console.log("SUCCESS! Function call:", JSON.stringify(result2.response.functionCalls, null, 2));
    } else {
        console.log("FAILED! Text response:", result2.response.text());
    }
}

test().catch(console.error);
