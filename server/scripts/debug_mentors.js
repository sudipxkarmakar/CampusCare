
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const debugMentors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // Find a student who supposedly has a mentor
        // The user showed a screenshot where "Diya Verma" (ID 69445b4681d7ad4cb464cb5a) has a mentor? 
        // Actually the screenshot in the prompt didn't strictly show the 'mentor' field being populated with an ID, it was cut off or I need to check the Additional Metadata closer if provided. 
        // Wait, the screenshot provided by user previously (Step 105) showed:
        // _id: ObjectId('...'), name: "Diya Verma", ... role: "student", ...
        // BUT 'mentor' field was NOT in the visible part of the screenshot provided in the interaction context text representation.
        // Wait, looking at the user request "in the schema i can see that the students already have a mentor".

        // Let's find ANY student with a mentor field
        const studentWithMentor = await User.findOne({
            role: 'student',
            mentor: { $exists: true, $ne: null }
        });

        if (!studentWithMentor) {
            console.log("❌ No students found with a 'mentor' field set.");
            // Let's check if any student exists at all
            const anyStudent = await User.findOne({ role: 'student' });
            if (anyStudent) {
                console.log(`Found a student: ${anyStudent.name}, but mentor is:`, anyStudent.mentor);
            }
        } else {
            console.log(`✅ Found student with mentor ID: ${studentWithMentor.name}`);
            console.log(`Mentor ID: ${studentWithMentor.mentor}`);

            // Now try to populate
            const populatedStudent = await User.findById(studentWithMentor._id).populate('mentor', 'name');
            console.log("After populate:", populatedStudent.mentor);

            if (!populatedStudent.mentor) {
                console.log("❌ Populate returned null. The mentor ID might not exist in Users collection.");
            } else {
                console.log(`✅ Populated Mentor Name: ${populatedStudent.mentor.name}`);
            }
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

debugMentors();
