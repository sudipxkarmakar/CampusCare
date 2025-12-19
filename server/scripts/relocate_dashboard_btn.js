
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

        // Regex to match the Dashboard Button block in Header
        // Relaxed matching for comment and attributes order
        // Captures Group 1: href value
        const regex = /<!--\s*Dashboard Button[\s\S]*?-->\s*<a\s+href="([^"]+)"\s+class="dashboard-btn-nav"[\s\S]*?>\s*Dashboard\s*<\/a>/i;

        const match = content.match(regex);

        if (match) {
            console.log(`Relocating dashboard button in: ${filePath}`);
            const href = match[1];

            // 1. Remove from Header
            let newContent = content.replace(regex, '');

            // 2. Prepare New Layout (Sub-header / Right Aligned)
            const newButtonHtml = `
  <!-- Relocated Dashboard Button -->
  <div class="dashboard-nav-bar" style="max-width: 1400px; margin: 10px auto; display: flex; justify-content: flex-end; padding-right: 2%;">
    <a href="${href}" style="background: rgba(255, 255, 255, 0.9); color: #3b82f6; padding: 8px 20px; border-radius: 30px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 8px; border: 1px solid #eff6ff; transition: all 0.2s ease;">
      <i class="fa-solid fa-layer-group"></i> Dashboard
    </a>
  </div>`;

            // 3. Inject after </header>
            // We use replace first occurrence of </header>
            newContent = newContent.replace('</header>', `</header>${newButtonHtml}`);

            fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
});
