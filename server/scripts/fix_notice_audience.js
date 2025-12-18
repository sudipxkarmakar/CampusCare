
import mongoose from 'mongoose';
import Notice from '../src/models/Notice.js';
import dotenv from 'dotenv';
import path from 'path';

// Use absolute path for .env
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function fixNoticeAudience() {
    try {
        if (!process.env.MONGO_URI) {
            console.log("Env Path tried:", envPath);
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected");

        const titleToFix = "Faculty Meeting on Curriculum Review";
        const notice = await Notice.findOne({ title: titleToFix });

        if (notice) {
            console.log(`Found notice: "${notice.title}"`);
            console.log(`Current Audience: ${notice.audience}`);
            console.log(`Current Target Dept: ${notice.targetDept}`);

            if (notice.audience !== 'teacher') {
                notice.audience = 'teacher';
                await notice.save();
                console.log(`Updated audience to 'teacher'.`);
            } else {
                console.log("Audience is already 'teacher'.");
            }
        } else {
            console.log(`Notice not found: "${titleToFix}"`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fixNoticeAudience();
