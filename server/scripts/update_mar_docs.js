
import mongoose from 'mongoose';
import MarMooc from '../src/models/MarMooc.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const updateDocs = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const validPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

        // Update ALL records that have the mock filename or are empty
        // Using regex to catch 'pending_verification.pdf' or similar variants
        const result = await MarMooc.updateMany(
            {
                $or: [
                    { certificateUrl: { $regex: 'pending', $options: 'i' } },
                    { certificateUrl: { $exists: false } },
                    { certificateUrl: '' }
                ]
            },
            { $set: { certificateUrl: validPdfUrl } }
        );

        console.log(`Matched and updated ${result.matchedCount} records.`);
        console.log('All documents updated with valid sample PDF link.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating docs:', error);
        process.exit(1);
    }
};

updateDocs();
