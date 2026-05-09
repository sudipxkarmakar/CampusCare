import axios from 'axios';

export const analyzeComplaint = async (text) => {
    try {
        const response = await axios.post('http://127.0.0.1:8000/analyze', {
            text: text
        });
        console.log('AI Service Response:', response.data);

        let { category, priority } = response.data;

        // Validation & Normalization
        if (priority) {
            priority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
        }

        const lowerText = text.toLowerCase();
        
        // 1. CRITICAL SAFETY OVERRIDES (Guarantee 100% safety for extreme cases)
        // We only override things that the ML might classify as 'Medium' but are actually life-safety risks.
        const isLifeSafety = ['fire', 'burning', 'sparking', 'electric shock', 'unconscious', 'chest pain', 'suicidal', 'heart attack', 'poisoning'].some(k => lowerText.includes(k));
        const isSecurityEmergency = ['physical fight', 'harassment', 'ragging', 'stolen', 'theft', 'robbery'].some(k => lowerText.includes(k));

        if (isLifeSafety || isSecurityEmergency) {
            console.log('EMERGENCY OVERRIDE: Forcing Urgent priority.');
            priority = 'Urgent';
        }

        // 2. DISCIPLINARY CATEGORY SAFETY
        // Ensure theft/loss of valuables is always Disciplinary (Security) even if ML is unsure.
        const hasTheftKeywords = ['stolen', 'theft', 'robbery', 'lost', 'missing'].some(k => lowerText.includes(k));
        const hasValuables = ['phone', 'wallet', 'laptop', 'bag', 'chain', 'watch', 'jewellery', 'purse', 'gold', 'cash', 'money', 'cycle', 'keys'].some(k => lowerText.includes(k));
        
        if (hasTheftKeywords && hasValuables) {
            category = 'Disciplinary';
        }

        // NOTE: Infrastructure issues (Projector, Mirror, Bench, Fan, WiFi) are now 
        // 100% handled by the ML model which was trained on 4000+ samples.

        return { category, priority };
    } catch (error) {
        console.error('AI SERVICE ERROR:', error.message);
        const lowerText = text.toLowerCase();
        
        // Fallback Logic for when ML Service is DOWN
        if (['fire', 'shock', 'unconscious', 'stolen', 'fight'].some(k => lowerText.includes(k))) {
            return { category: 'Disciplinary', priority: 'Urgent' };
        }

        if (lowerText.includes('projector') || lowerText.includes('mirror') || lowerText.includes('bench')) {
            return { category: 'Civil', priority: 'High' };
        }

        return { category: 'Other', priority: 'Medium' };
    }
};

export const sendFeedback = async (text, category, priority) => {
    try {
        await axios.post('http://127.0.0.1:8000/feedback', {
            text,
            category,
            priority
        });
        console.log('Feedback sent to ML Service successfully.');
    } catch (error) {
        console.error('Failed to send feedback to ML Service:', error.message);
    }
};
