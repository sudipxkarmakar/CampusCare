
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const traverseDir = (dir, callback) => {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            traverseDir(fullPath, callback);
        } else {
            callback(fullPath);
        }
    });
};

const docsDir = path.resolve(__dirname, '../../docs');

console.log(`Scanning: ${docsDir}`);

traverseDir(docsDir, (filePath) => {
    if (path.extname(filePath) === '.html') {
        let content = fs.readFileSync(filePath, 'utf8');

        // Match the anchor tag inside the dashboard-nav-bar div
        // We look for: <a href="..." style="...">...Dashboard...</a>
        // And replace style="..." with class="dashboard-floating-btn"

        // This regex targets the specific anchor tag we injected earlier
        // It's robust enough to find the one inside the div based on context or just the specific style string if unique
        // Since we know the style string starts with "background: rgba(255, 255, 255, 0.9);" or similar from previous steps

        const styleRegex = /<a href="([^"]+)" style="background: rgba\(255, 255, 255, 0\.9\);[^"]+">/g;

        if (styleRegex.test(content)) {
            console.log(`Applying CSS class to: ${filePath}`);
            // Replace with class attribute
            const newContent = content.replace(styleRegex, '<a href="$1" class="dashboard-floating-btn">');
            fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
});
