
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

        // Target the specific div we injected
        // We look for: <div class="dashboard-nav-bar" style="..."
        const regex = /<div class="dashboard-nav-bar" style="[^"]+">/g;

        // New Style: Matches Navbar (width 95%, max-width 1400px, margin auto)
        // Removed padding-right: 2% because width: 95% handles the spacing from edge.
        const newStyle = 'max-width: 1400px; width: 95%; margin: 10px auto; display: flex; justify-content: flex-end;';
        const replacement = `<div class="dashboard-nav-bar" style="${newStyle}">`;

        if (regex.test(content)) {
            console.log(`Adjusting alignment in: ${filePath}`);
            const newContent = content.replace(regex, replacement);
            fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
});
