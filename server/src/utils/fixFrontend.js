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

    // 1. Replace hardcoded localhost URLs that are NOT already dynamic
    // This regex looks for 'http://localhost:5000' and replaces it with the dynamic logic
    // But we must avoid double-replacing or breaking existing dynamic ones.
    
    // Simplest approach: Replace any standalone 'http://localhost:5000' string literal
    content = content.replace(/'http:\/\/localhost:5000'/g, DYNAMIC_URL_PATTERN);
    content = content.replace(/"http:\/\/localhost:5000"/g, `"${DYNAMIC_URL_PATTERN}"`);
    content = content.replace(/`http:\/\/localhost:5000`/g, `\`${DYNAMIC_URL_PATTERN}\``);

    // 2. Fix broken ternary logic (sometimes people forget the quotes or have double ternary)
    // Cleanup double logic: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://campuscare-backend-96cn.onrender.com') ...
    const doubleTernary = /\(window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1' \? \(window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1' \? 'http:\/\/localhost:5000' : 'https:\/\/campuscare-backend-96cn\.onrender\.com'\)/g;
    content = content.replace(doubleTernary, DYNAMIC_URL_PATTERN);

    // 3. Inject finally blocks to stop loading text/spinners in fetch calls
    // This is harder to automate perfectly, but we can target common patterns.
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`[FIXED] ${path.relative(docsDir, filePath)}`);
    }
});
