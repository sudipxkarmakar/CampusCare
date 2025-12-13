import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env');

const envContent = `PORT=5000
MONGO_URI=mongodb+srv://skmultiverse:skmultiverse@cluster0.y46rdtn.mongodb.net/campuscare?appName=Cluster0
JWT_SECRET=campuscare_secret_key_123
`;

fs.writeFileSync(envPath, envContent);
console.log('✅ .env file updated successfully with Atlas URI');
console.log(fs.readFileSync(envPath, 'utf8'));
