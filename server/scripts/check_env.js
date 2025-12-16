import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// specific path to .env in server root
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log("Checking MONGO_URI...");
const uri = process.env.MONGO_URI;

if (uri) {
    console.log("MONGO_URI found (masked):", uri.substring(0, 15) + "..." + uri.substring(uri.length - 10));
    console.log("URI Length:", uri.length);
} else {
    console.error("❌ MONGO_URI is NOT defined in process.env");
}
