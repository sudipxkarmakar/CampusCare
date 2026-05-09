import axios from 'axios';

export const analyzeComplaint = async (text) => {
    try {
        const response = await axios.post('http://127.0.0.1:8000/analyze', {
            text: text
        });
        console.log('AI Service Response:', response.data);

        let { category, priority } = response.data;

        // Validation & Normalization
        const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];

        if (priority) {
            // Ensure Title Case (e.g. "urgent" -> "Urgent")
            priority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
        }

        // HARD OVERRIDE for robustness (as requested by user)
        const lowerText = text.toLowerCase();
        
        // 1. Life-Safety & Emergency Overrides (Global)
        const isEmergency = ['fire', 'burning', 'sparking', 'electric shock', 'short circuit', 'unconscious', 'fainted', 'bleeding', 'suicidal', 'heart attack', 'poisoning', 'physical fight', 'harassment', 'ragging'].some(k => lowerText.includes(k));
        
        if (isEmergency) {
            console.log('EMERGENCY OVERRIDE: Setting priority to Urgent for life-safety keywords.');
            priority = 'Urgent';
        }

        // 2. Infrastructure Overrides (Civil/Electrical)
        if (lowerText.includes('projector')) {
            console.log('PROJECTOR OVERRIDE: Setting category to Civil and priority to Urgent.');
            category = 'Civil';
            priority = 'Urgent';
        } else if (lowerText.includes('bench') || lowerText.includes('whiteboard') || lowerText.includes('desk') || lowerText.includes('chair')) {
            console.log('INFRASTRUCTURE OVERRIDE: Setting category to Civil.');
            category = 'Civil';
            // Benches/desks stay as predicted (Medium/Low)
        }

        if (lowerText.includes('fan') || lowerText.includes('light') || lowerText.includes('ac ') || lowerText.includes('switchboard')) {
            console.log('ELECTRICAL OVERRIDE: Setting category to Electrical.');
            category = 'Electrical';
        }

        // 3. SAFETY CONDITION: Prevent theft/loss from being hidden as 'Personal'
        const hasTheft = ['stolen', 'theft', 'robbery'].some(k => lowerText.includes(k));
        const hasLostOrMissing = ['lost', 'missing'].some(k => lowerText.includes(k));
        const hasValuables = ['phone', 'wallet', 'laptop', 'bag', 'chain', 'watch', 'jewellery', 'purse', 'gold', 'bracelet', 'ring', 'cash', 'money', 'cycle', 'scooter', 'charger', 'spectacles', 'specs', 'id card', 'keys'].some(k => lowerText.includes(k));
        
        if (hasTheft || (hasLostOrMissing && hasValuables)) {
            console.log('SAFETY CONDITION: Overriding category to Disciplinary due to theft/loss keywords.');
            category = 'Disciplinary';
        }

        return { category, priority };
    } catch (error) {
        console.error('AI SERVICE ERROR:', error.message);
        
        // Even in case of error, try to be robust for common keywords
        const lowerText = text.toLowerCase();
        
        if (['fire', 'burning', 'shock', 'unconscious'].some(k => lowerText.includes(k))) {
            return { category: 'Disciplinary', priority: 'Urgent' }; // Default to Disciplinary/Security for fire/fight
        }

        if (lowerText.includes('projector') || lowerText.includes('bench') || lowerText.includes('fan')) {
            return { category: 'Civil', priority: 'High' };
        }

        if (error.code === 'ECONNREFUSED') {
            console.error('Make sure the Python ML Service is running on port 8000!');
        }
        // Fallback
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
        // Don't throw, just log. Feedback is non-critical for the main flow.
    }
};
