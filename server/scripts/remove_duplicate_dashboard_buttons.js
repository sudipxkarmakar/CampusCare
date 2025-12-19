
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.resolve(__dirname, '../../docs');

// 1. Remove floating button from Hostel Index
const hostelIndex = path.join(docsDir, 'hostel/index.html');
if (fs.existsSync(hostelIndex)) {
    let content = fs.readFileSync(hostelIndex, 'utf8');
    // Regex to match the floating button div
    const hostelBtnRegex = /<div class="dashboard-nav-bar"[\s\S]*?<\/div>/;
    if (hostelBtnRegex.test(content)) {
        content = content.replace(hostelBtnRegex, '');
        fs.writeFileSync(hostelIndex, content, 'utf8');
        console.log('Removed Dashboard button from Hostel Index.');
    } else {
        console.log('Hostel Index button not found or already removed.');
    }
}

// 2. Remove duplicate Navbar Dashboard button from Warden submodule pages
const wardenDir = path.join(docsDir, 'warden');
if (fs.existsSync(wardenDir)) {
    fs.readdirSync(wardenDir).forEach(file => {
        if (path.extname(file) === '.html' && file !== 'index.html') {
            const filePath = path.join(wardenDir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            // Regex to remove the specific navbar dashboard link
            // Structure seen in leaves.html:
            // <div>
            //     <a href="index.html" style="text-decoration:none; color:#2d3748; font-weight:600;">Dashboard</a>
            // </div>

            // We'll target the div wrapping the dashboard link inside the header
            const navbarBtnRegex = /<div>\s*<a href="index\.html" style="text-decoration:none; color:#2d3748; font-weight:600;">Dashboard<\/a>\s*<\/div>/g;

            if (navbarBtnRegex.test(content)) {
                content = content.replace(navbarBtnRegex, '');
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Removed Navbar Dashboard link from: ${file}`);
            }
        }
    });
}
