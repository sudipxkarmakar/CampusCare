import mongoose from 'mongoose';
import Complaint from '../src/models/Complaint.js';
import fetch from 'node-fetch';

const MONGO_URI = 'mongodb+srv://skmultiverse:skmultiverse@cluster0.y46rdtn.mongodb.net/campuscare?retryWrites=true&w=majority&appName=Cluster0';

const includesAny = (text, words) => words.some((word) => {
    const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
});

const classifyComplaint = (text = '') => {
    const lower = text.toLowerCase();
    let category = 'Other';
    if (includesAny(lower, ['fan', 'light', 'electric', 'power', 'wire', 'shock'])) category = 'Electrical';
    else if (includesAny(lower, ['toilet', 'washroom', 'dirty', 'clean', 'garbage', 'smell'])) category = 'Sanitation';
    else if (includesAny(lower, ['bench', 'door', 'window', 'wall', 'pipe', 'water leak'])) category = 'Civil';
    else if (includesAny(lower, ['wifi', 'internet', 'computer', 'projector', 'network'])) category = 'IT';
    else if (includesAny(lower, ['food', 'mess', 'canteen', 'meal'])) category = 'Mess';
    else if (includesAny(lower, ['ragging', 'fight', 'harassment', 'theft', 'stolen'])) category = 'Disciplinary';
    
    // Heuristic safety-net keywords for personal health, wellness, and injuries
    const personalKeywords = [
      'personal', 'mentor', 'teacher', 'fever', 'headache', 'sick', 'sickness',
      'anxiety', 'depression', 'stressed', 'stress', 'medical', 'vomit', 'vomiting',
      'illness', 'doctor', 'ankle', 'injury', 'injured', 'pain', 'hurt', 'wound',
      'hospital', 'accident', 'cough', 'bleed', 'bleeding', 'counseling', 'mental',
      'unconscious', 'fainted', 'faint', 'leg', 'arm', 'hand', 'foot', 'body',
      'stomach', 'chest', 'head', 'ear', 'eye', 'tooth', 'throat', 'ache', 'aching',
      'fracture', 'sprain', 'nausea', 'dizzy', 'dizziness', 'burn', 'burnt', 'cut',
      'medicine', 'pill', 'clinic', 'nurse', 'cramp', 'panic', 'suicidal', 'suicide',
      'homesick', 'sad', 'crying', 'depressed', 'fell down', 'collapsed', 'collapse',
      'disease', 'allergy', 'allergic', 'first aid', 'flu', 'cold', 'infection'
    ];
    if (includesAny(lower, personalKeywords)) category = 'Personal';

    let priority = 'Medium';
    if (includesAny(lower, ['fire', 'shock', 'injury', 'harassment', 'ragging', 'urgent', 'danger'])) priority = 'Urgent';
    else if (includesAny(lower, ['not working', 'broken', 'leak', 'stolen'])) priority = 'High';
    else if (includesAny(lower, ['minor', 'request', 'suggestion'])) priority = 'Low';

    return { category, priority };
};

async function cleanDatabase() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    const complaints = await Complaint.find({});
    console.log(`Total complaints in database: ${complaints.length}`);

    let updatedCount = 0;

    for (const complaint of complaints) {
        const text = `${complaint.title} ${complaint.description}`;
        
        // 1. Get heuristic baseline classification
        let analysis = classifyComplaint(text);
        
        // 2. Query FastAPI ML if running
        try {
            const mlResponse = await fetch('http://127.0.0.1:8000/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (mlResponse.ok) {
                const mlData = await mlResponse.json();
                if (mlData.category && mlData.priority) {
                    // Double-Insurance: If heuristic matched 'Personal', keep 'Personal'
                    if (analysis.category !== 'Personal') {
                        analysis.category = mlData.category;
                        analysis.priority = mlData.priority;
                    } else {
                        analysis.priority = mlData.priority;
                    }
                }
            }
        } catch (mlErr) {
            // Ignore connection errors, fall back to heuristic
        }

        // 3. Update category/priority if changed
        if (complaint.category !== analysis.category || complaint.priority !== analysis.priority) {
            console.log(`Updating "${complaint.title}"`);
            console.log(` -> Old: Category=${complaint.category}, Priority=${complaint.priority}`);
            complaint.category = analysis.category;
            complaint.priority = analysis.priority;
            await complaint.save();
            console.log(` -> New: Category=${complaint.category}, Priority=${complaint.priority}\n`);
            updatedCount++;
        }
    }

    console.log(`Successfully updated ${updatedCount} complaints to their correct categories/priorities.`);
    process.exit(0);
}

cleanDatabase().catch(err => {
    console.error("Error during database cleaning:", err);
    process.exit(1);
});
