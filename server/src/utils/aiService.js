export const analyzeComplaint = (text) => {
    const lowerText = text.toLowerCase();

    let category = 'Other';
    let priority = 'Medium';

    // 1. Determine Category
    if (lowerText.includes('wire') || lowerText.includes('fan') || lowerText.includes('light') || lowerText.includes('switch') || lowerText.includes('power')) {
        category = 'Electrical';
    } else if (lowerText.includes('water') || lowerText.includes('leak') || lowerText.includes('pipe') || lowerText.includes('tap') || lowerText.includes('bathroom')) {
        category = 'Sanitation';
    } else if (lowerText.includes('internet') || lowerText.includes('wifi') || lowerText.includes('network') || lowerText.includes('computer')) {
        category = 'IT';
    } else if (lowerText.includes('food') || lowerText.includes('meal') || lowerText.includes('breakfast') || lowerText.includes('dinner')) {
        category = 'Mess';
    } else if (lowerText.includes('wall') || lowerText.includes('door') || lowerText.includes('window') || lowerText.includes('paint')) {
        category = 'Civil';
    }

    // 2. Determine Priority
    if (lowerText.includes('fire') || lowerText.includes('spark') || lowerText.includes('smoke') || lowerText.includes('danger') || lowerText.includes('ragging') || lowerText.includes('harassment')) {
        priority = 'Urgent';
    } else if (lowerText.includes('broken') || lowerText.includes('not working') || lowerText.includes('fail')) {
        priority = 'High';
    }

    // Special Case: Ragging is strictly High Priority and distinct category maybe? 
    if (lowerText.includes('ragging') || lowerText.includes('harassment')) {
        category = 'Disciplinary';
    }

    return { category, priority };
};
