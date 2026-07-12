import mongoose from 'mongoose';
import Complaint from '../src/models/Complaint.js';

const MONGO_URI = 'mongodb+srv://skmultiverse:skmultiverse@cluster0.y46rdtn.mongodb.net/campuscare?retryWrites=true&w=majority&appName=Cluster0';

const personalKeywords = [
  'headache', 'fever', 'sick', 'anxiety', 'depression', 'stressed', 'medical', 'vomit', 
  'illness', 'doctor', 'ankle', 'injury', 'injured', 'pain', 'hurt', 'wound', 'hospital', 
  'accident', 'collapsed', 'collapse', 'fell down'
];

async function cleanDatabase() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    const complaints = await Complaint.find({});
    console.log(`Total complaints in database: ${complaints.length}`);

    let updatedCount = 0;

    for (const complaint of complaints) {
        const text = `${complaint.title} ${complaint.description}`.toLowerCase();
        const hasKeyword = personalKeywords.some(keyword => text.includes(keyword));

        // If it matches personal health keywords but isn't marked as Personal
        if (hasKeyword && complaint.category !== 'Personal') {
            console.log(`Updating: "${complaint.title}"`);
            console.log(` -> Old Category: ${complaint.category}`);
            complaint.category = 'Personal';
            
            // Adjust priority to Urgent or High based on content severity
            if (text.includes('severe') || text.includes('emergency') || text.includes('vomit') || text.includes('collapsed') || text.includes('broke')) {
                complaint.priority = 'Urgent';
            } else {
                complaint.priority = 'High';
            }
            
            await complaint.save();
            updatedCount++;
            console.log(` -> New Category: Personal, New Priority: ${complaint.priority}\n`);
        }
    }

    console.log(`Successfully updated ${updatedCount} old complaints to the 'Personal' category.`);
    process.exit(0);
}

cleanDatabase().catch(err => {
    console.error("Error during database cleaning:", err);
    process.exit(1);
});
