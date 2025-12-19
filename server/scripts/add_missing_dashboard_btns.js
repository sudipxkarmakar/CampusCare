
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.resolve(__dirname, '../../docs');

const buttonHtml = (targetUrl) => `
    <!-- Dashboard Button -->
    <div class="dashboard-nav-bar" style="max-width: 1400px; width: 95%; margin: 30px auto 0px; display: flex; justify-content: flex-end;">
        <a href="${targetUrl}" class="dashboard-floating-btn">Dashboard</a>
    </div>`;

const traverseAndInject = (dir, role) => {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach(file => {
        if (path.extname(file) === '.html') {
            const filePath = path.join(dir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            // Skip if button already exists
            if (content.includes('dashboard-floating-btn')) {
                console.log(`Skipping (already exists): ${filePath}`);
                return;
            }

            // Logic per role
            let targetUrl = 'index.html';
            let shouldInject = false;

            if (role === 'hostel' && file === 'index.html') {
                targetUrl = '../index.html'; // Hostel Home -> Landing Page
                shouldInject = true;
            } else if (role !== 'hostel' && file !== 'index.html') {
                // For Teacher, Warden, Principal: Inject in subpages only
                targetUrl = 'index.html'; // Subpage -> Role Dashboard
                shouldInject = true;
            }

            if (shouldInject) {
                // Injection Point: After </header> or similar top bar
                // If </header> exists, put it after.
                // If not, try to put it after the "CampusCare" top bar div if identifiable, or just top of body.
                // Based on previous inspections, most pages have a <header> or a top div.

                if (content.includes('</header>')) {
                    content = content.replace('</header>', `</header>${buttonHtml(targetUrl)}`);
                    console.log(`Injected Button in: ${filePath}`);
                    fs.writeFileSync(filePath, content, 'utf8');
                } else {
                    // Fallback: Look for the specific header div structure if <header> tag is missing
                    // Use a common closing tag for the header area if possible
                    // Or search for the "Hero" section start and inject before it?

                    // Let's try to find the closing div of the top bar
                    // <div class="glass" ... > ... </div>
                    // This is risky. Let's look for <main> and insert before it.

                    if (content.includes('<main')) {
                        content = content.replace('<main', `${buttonHtml(targetUrl)}\n<main`);
                        console.log(`Injected Button (before main) in: ${filePath}`);
                        fs.writeFileSync(filePath, content, 'utf8');
                    } else {
                        console.log(`Could not find injection point for: ${filePath}`);
                    }
                }
            }
        }
    });
};

// Execute for modules
console.log('Processing Hostel...');
traverseAndInject(path.join(docsDir, 'hostel'), 'hostel');

console.log('Processing Teacher...');
traverseAndInject(path.join(docsDir, 'teacher'), 'teacher');

console.log('Processing Warden...');
traverseAndInject(path.join(docsDir, 'warden'), 'warden');

console.log('Processing Principal...');
traverseAndInject(path.join(docsDir, 'principal'), 'principal');
