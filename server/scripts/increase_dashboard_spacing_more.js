
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

        // Target existing margin style: margin: 25px auto 10px;
        // Goal: Increase top margin to 50px
        const regex = /margin:\s*25px auto 10px;/g;

        if (regex.test(content)) {
            console.log(`Increasing spacing (50px) in: ${filePath}`);
            const newContent = content.replace(regex, 'margin: 50px auto 10px;');
            fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
});
