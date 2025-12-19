
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

        // Regex to match the Complaint Button block
        const regex = /\s*<!-- Complaint Button -->\s*<a href="[^"]*complaints\/index\.html"[\s\S]*?<\/a>/gi;

        if (regex.test(content)) {
            console.log(`Removing navbar complaint button from: ${filePath}`);
            const newContent = content.replace(regex, '');
            fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
});
