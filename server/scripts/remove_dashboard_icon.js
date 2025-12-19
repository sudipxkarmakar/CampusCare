
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

        // Target the icon inside the dashboard button
        // Current: <a href="..." class="dashboard-floating-btn">\s*<i class="fa-solid fa-layer-group"></i> Dashboard\s*</a>
        // We want: <a href="..." class="dashboard-floating-btn">Dashboard</a>

        // Regex to find the button content
        // We look for class="dashboard-floating-btn" then the content inside >...</a>
        const regex = /(class="dashboard-floating-btn"[^>]*>)\s*<i class="[^"]+"><\/i>\s*(Dashboard)\s*(<\/a>)/g;

        if (regex.test(content)) {
            console.log(`Removing icon in: ${filePath}`);
            const newContent = content.replace(regex, '$1$2$3');
            fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
});
