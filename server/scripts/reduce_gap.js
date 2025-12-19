
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
        let modified = false;

        // 1. Remove bottom margin from dashboard button container
        // Current: margin: 30px auto 10px;
        // Target: margin: 30px auto 0px;
        const btnRegex = /margin:\s*30px auto 10px;/g;
        if (btnRegex.test(content)) {
            content = content.replace(btnRegex, 'margin: 30px auto 0px;');
            modified = true;
        }

        // 2. Reduce top margin of Hero Section
        // Current: margin-top: 2rem; (or margin-top: 3rem; margin-top: 4rem;)
        // Target: margin-top: 0.5rem;
        // This targets the inline style attribute of the hero section
        // Matches: section class="hero..." style="... margin-top: 2rem; ..."

        // We look for a pattern that captures the style tag content
        // This is a bit risky with regex but the structure is consistent in this project
        // margin-top: 2rem; margin-bottom: 2rem;

        const heroRegex = /margin-top:\s*\d+(\.\d+)?rem;/g;
        // We only want to target this inside the hero section context, but typically this specific inline style 
        // "margin-top: 2rem; margin-bottom: 2rem;" or variations is found on the hero.
        // Let's rely on finding "margin-top: Xrem;" specifically where it appears near hero context or just broadly if safe.
        // Given the previous files, the hero section has specific inline styles.

        // Let's refine: replace "margin-top: 2rem;" with "margin-top: 0.5rem;" globally might be too aggressive if used elsewhere.
        // But in these specific files, it seems primary use is on hero.
        // Let's check for the student-hero specific line

        if (content.includes('class="hero student-hero"')) {
            if (content.includes('margin-top: 2rem;')) {
                content = content.replace('margin-top: 2rem;', 'margin-top: 0.5rem;');
                modified = true;
            }
        }

        // Also check teacher-hero if present
        if (content.includes('class="hero teacher-hero"')) {
            // Teacher hero might have 3rem
            if (content.includes('margin-top: 3rem;')) {
                content = content.replace('margin-top: 3rem;', 'margin-top: 0.5rem;');
                modified = true;
            }
            // Or 2rem
            if (content.includes('margin-top: 2rem;')) {
                content = content.replace('margin-top: 2rem;', 'margin-top: 0.5rem;');
                modified = true;
            }
        }

        // Also check 'hero' generic if present with specific style
        const genericHeroStyle = /style="text-align: center; margin-top: 2rem;/;
        if (genericHeroStyle.test(content)) {
            content = content.replace(genericHeroStyle, 'style="text-align: center; margin-top: 0.5rem;');
            modified = true;
        }


        if (modified) {
            console.log(`Reducing gaps in: ${filePath}`);
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
});
