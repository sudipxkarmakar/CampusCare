import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.join(__dirname, '../../../docs');

const BACKEND_PROD = 'https://campuscare-backend-96cn.onrender.com';
const DYNAMIC_URL_PATTERN = `(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : '${BACKEND_PROD}')`;

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(docsDir, (filePath) => {
    if (!filePath.endsWith('.js') && !filePath.endsWith('.html')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Clean up broken ternaries from previous run
    const brokenTernary = /\) : 'https:\/\/campuscare-backend-96cn\.onrender\.com'\)/g;
    content = content.replace(brokenTernary, ')');

    // 2. Standardize DYNAMIC_URL_PATTERN
    // This is the clean version we want
    const cleanDynamic = `(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : '${BACKEND_PROD}')`;
    
    // Find variations of the dynamic logic and consolidate them
    // This handles cases where my script or previous manual edits created fragments
    content = content.replace(/\(window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1' \? 'http:\/\/localhost:5000' : 'https:\/\/campuscare-backend-96cn\.onrender\.com'\)/g, cleanDynamic);

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`[CLEANED] ${path.relative(docsDir, filePath)}`);
    }
});
