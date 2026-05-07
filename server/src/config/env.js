import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This module MUST be imported before any other module that depends on process.env
const prodEnvPath = path.join(__dirname, '../../.env.production');
const localEnvPath = path.join(__dirname, '../../.env');

if (fs.existsSync(prodEnvPath)) {
    console.log('[ENV] Loading Production environment...');
    dotenv.config({ path: prodEnvPath });
} else if (fs.existsSync(localEnvPath)) {
    console.log('[ENV] Loading Local environment...');
    dotenv.config({ path: localEnvPath });
} else {
    console.warn('[ENV] No .env or .env.production found.');
}

export default process.env;
