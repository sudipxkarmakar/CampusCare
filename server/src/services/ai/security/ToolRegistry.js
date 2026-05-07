import { z } from 'zod';

export const ToolRegistry = {
    trigger_sos: {
        schema: z.object({
            emergencyType: z.string().min(1),
            location: z.string().optional(),
            details: z.string().optional()
        }),
        declaration: {
            name: "trigger_sos",
            description: "Immediately trigger an SOS emergency workflow. Bypasses confirmation.",
            parameters: {
                type: "object",
                properties: { emergencyType: { type: "string" }, location: { type: "string" }, details: { type: "string" } },
                required: ["emergencyType"]
            }
        },
        retryable: false,
        rollbackable: false,
        critical: true
    },
    draft_complaint: {
        schema: z.object({
            title: z.string().min(1),
            description: z.string().min(1),
            category: z.string().min(1),
            priority: z.string().min(1),
            department: z.string().optional()
        }),
        declaration: {
            name: "draft_complaint",
            description: "Submit a complaint draft after getting user confirmation.",
            parameters: {
                type: "object",
                properties: { title: { type: "string" }, description: { type: "string" }, category: { type: "string" }, priority: { type: "string" }, department: { type: "string" } },
                required: ["title", "description", "category", "priority"]
            }
        },
        retryable: true,
        rollbackable: true,
        critical: false
    },
    submit_leave: {
        schema: z.object({
            reason: z.string().min(1),
            startDate: z.string().min(1),
            endDate: z.string().min(1),
            leaveType: z.string().min(1)
        }),
        declaration: {
            name: "submit_leave",
            description: "Submit a leave application after getting user confirmation.",
            parameters: {
                type: "object",
                properties: { reason: { type: "string" }, startDate: { type: "string" }, endDate: { type: "string" }, leaveType: { type: "string" } },
                required: ["reason", "startDate", "endDate", "leaveType"]
            }
        },
        retryable: true,
        rollbackable: true,
        critical: false
    },
    create_assignment: {
        schema: z.object({
            subject: z.string().min(1),
            batch: z.string().min(1),
            deadline: z.string().min(1),
            marks: z.string().optional(),
            instructions: z.string().optional()
        }),
        declaration: {
            name: "create_assignment",
            description: "Create an assignment after getting user confirmation. (Teacher role)",
            parameters: {
                type: "object",
                properties: { subject: { type: "string" }, batch: { type: "string" }, deadline: { type: "string" }, marks: { type: "string" }, instructions: { type: "string" } },
                required: ["subject", "batch", "deadline"]
            }
        },
        retryable: true,
        rollbackable: true,
        critical: false
    }
};

export const VALID_TOOLS = Object.freeze(Object.keys(ToolRegistry));

export function getFunctionDeclarations() {
    return Object.values(ToolRegistry).map(tool => ({
        type: "function",
        function: tool.declaration
    }));
}
